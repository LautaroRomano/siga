import { measure, prisma, type EmailOutbox } from "@repo/db";

import { isEmailConfigured } from "../../env";
import { sendEmail, type EmailMessage } from "../../integrations/email";

export const maxEmailAttempts = 5;

// Espera creciente entre reintentos: el cron diario alcanza a reintentar los que fallaron.
const retryDelaysMinutes = [5, 30, 120, 720];

const retryDelay = (attempts: number) =>
  (retryDelaysMinutes[Math.min(attempts, retryDelaysMinutes.length) - 1] ?? 720) * 60_000;

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Error desconocido";

// Un intento de envío nunca lanza: el resultado queda en la fila y la acción sigue su curso.
export const deliverEmail = async (email: EmailOutbox, now = new Date()) => {
  if (!isEmailConfigured()) return email;
  try {
    await measure("email", () =>
      sendEmail({ to: email.to, subject: email.subject, html: email.html }),
    );
    return await prisma.emailOutbox.update({
      where: { id: email.id },
      data: { status: "SENT", sentAt: now, lastError: null, attempts: email.attempts + 1 },
    });
  } catch (error) {
    const attempts = email.attempts + 1;
    return prisma.emailOutbox.update({
      where: { id: email.id },
      data: {
        attempts,
        lastError: errorMessage(error),
        status: attempts >= maxEmailAttempts ? "FAILED" : "PENDING",
        sendAfter: new Date(now.getTime() + retryDelay(attempts)),
      },
    });
  }
};

export const enqueueEmail = async (
  organizationId: string,
  message: EmailMessage,
  now = new Date(),
) => {
  const queued = await prisma.emailOutbox.create({
    data: { organizationId, ...message, sendAfter: now },
  });
  return deliverEmail(queued, now);
};

export const deliverPendingEmails = async (now = new Date()) => {
  const pending = await prisma.emailOutbox.findMany({
    where: { status: "PENDING", sendAfter: { lte: now } },
    orderBy: { sendAfter: "asc" },
    take: 100,
  });
  let failed = 0;
  for (const email of pending) {
    const result = await deliverEmail(email, now);
    if (result.status !== "SENT") failed += 1;
  }
  return { processed: pending.length - failed, failed };
};
