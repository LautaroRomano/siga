import { prisma } from "@repo/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiEnv } from "../../env";
import type * as Email from "../../integrations/email";
import { createOrganization, resetDatabase, type TestOrganization } from "../../test/db";

import { deliverPendingEmails, enqueueEmail, maxEmailAttempts } from "./outbox";

vi.mock("../../integrations/email", async (importOriginal) => ({
  ...(await importOriginal<typeof Email>()),
  sendEmail: vi.fn(),
}));

const { sendEmail } = vi.mocked(await import("../../integrations/email"));

let organization: TestOrganization;
const at = (iso: string) => new Date(iso);
const message = { to: "juan@example.com", subject: "Hola", html: "<p>Hola</p>" };

beforeEach(async () => {
  await resetDatabase();
  vi.clearAllMocks();
  apiEnv.email.resendApiKey = "re_test";
  organization = await createOrganization();
});

afterEach(() => {
  apiEnv.email.resendApiKey = "";
});

describe("cola de emails", () => {
  it("envía al instante y marca SENT", async () => {
    sendEmail.mockResolvedValue("msg-1");
    const sent = await enqueueEmail(
      organization.organizationId,
      message,
      at("2026-09-14T12:00:00Z"),
    );
    expect(sent).toMatchObject({ status: "SENT", attempts: 1, lastError: null });
    expect(sent.sentAt?.toISOString()).toBe("2026-09-14T12:00:00.000Z");
    expect(sendEmail).toHaveBeenCalledWith(message);
  });

  it("sin API key queda PENDING sin intentar, y el cron lo manda cuando aparece la clave", async () => {
    apiEnv.email.resendApiKey = "";
    const queued = await enqueueEmail(organization.organizationId, message);
    expect(queued).toMatchObject({ status: "PENDING", attempts: 0 });
    expect(sendEmail).not.toHaveBeenCalled();

    apiEnv.email.resendApiKey = "re_test";
    sendEmail.mockResolvedValue("msg-1");
    expect(await deliverPendingEmails()).toEqual({ processed: 1, failed: 0 });
    expect(await prisma.emailOutbox.findUniqueOrThrow({ where: { id: queued.id } })).toMatchObject({
      status: "SENT",
    });
  });

  it("una falla del proveedor no lanza: reintenta con espera creciente y a los 5 intentos queda FAILED", async () => {
    sendEmail.mockRejectedValue(new Error("Resend caído"));
    const now = at("2026-09-14T12:00:00Z");
    const failed = await enqueueEmail(organization.organizationId, message, now);
    expect(failed).toMatchObject({ status: "PENDING", attempts: 1, lastError: "Resend caído" });
    expect(failed.sendAfter.toISOString()).toBe("2026-09-14T12:05:00.000Z");

    // Antes de `sendAfter` no se reintenta.
    expect(await deliverPendingEmails(at("2026-09-14T12:01:00Z"))).toEqual({
      processed: 0,
      failed: 0,
    });
    expect(await deliverPendingEmails(at("2026-09-14T12:05:00Z"))).toEqual({
      processed: 0,
      failed: 1,
    });
    let email = await prisma.emailOutbox.findUniqueOrThrow({ where: { id: failed.id } });
    expect(email).toMatchObject({ attempts: 2, status: "PENDING" });
    expect(email.sendAfter.toISOString()).toBe("2026-09-14T12:35:00.000Z");

    // Cada reintento espera más que el anterior: se avanza un día por intento.
    for (let attempt = email.attempts; attempt < maxEmailAttempts; attempt += 1) {
      await deliverPendingEmails(at(`2026-09-${20 + attempt}T00:00:00Z`));
    }
    email = await prisma.emailOutbox.findUniqueOrThrow({ where: { id: failed.id } });
    expect(email).toMatchObject({ attempts: maxEmailAttempts, status: "FAILED" });
    expect(await deliverPendingEmails(at("2026-09-30T00:00:00Z"))).toEqual({
      processed: 0,
      failed: 0,
    });
    expect(sendEmail).toHaveBeenCalledTimes(maxEmailAttempts);
  });
});
