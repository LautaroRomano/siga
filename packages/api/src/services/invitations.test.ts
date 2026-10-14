import { getAuthContext } from "@repo/auth";
import { prisma } from "@repo/db";
import { beforeEach, describe, expect, it } from "vitest";

import {
  asOrganization,
  countAuditLogs,
  createMember,
  createOrganization,
  resetDatabase,
  signInAs,
  type TestOrganization,
} from "../test/db";

import {
  acceptInvitation,
  cancelInvitation,
  getInvitation,
  inviteMember,
  listPendingInvitations,
  rejectInvitation,
  resendInvitation,
  type Actor,
} from "./invitations";
import { listMembers, listOrganizationsOf } from "./memberships";

let organization: TestOrganization;
let admin: Actor;
const invitedEmail = "invitada@test.local";

const actorOf = async (member: TestOrganization, activeOrganizationId?: string): Promise<Actor> => {
  const headers = await signInAs(member.userId, activeOrganizationId);
  const auth = await getAuthContext(headers);
  if (!auth) throw new Error("Sin sesión");
  return { auth, headers };
};

const registerInvitee = async (email = invitedEmail) => {
  const invitee = await createOrganization();
  await prisma.user.update({ where: { id: invitee.userId }, data: { email } });
  return actorOf(invitee);
};

const outbox = () => prisma.emailOutbox.findMany({ orderBy: { createdAt: "asc" } });

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const invite = (email = invitedEmail) =>
  asOrganization(organization, () => inviteMember(admin, { email }));

beforeEach(async () => {
  await resetDatabase();
  organization = await createOrganization();
  admin = await actorOf(organization);
});

describe("invitar a un miembro", () => {
  it("crea una invitación que vence a los 7 días, manda el email y la lista como vigente", async () => {
    const invited = await invite();
    const invitation = await prisma.invitation.findUniqueOrThrow({ where: { id: invited.id } });
    expect(invitation).toMatchObject({
      email: invitedEmail,
      role: "member",
      status: "pending",
      organizationId: organization.organizationId,
    });
    expect(invitation.expiresAt.getTime()).toBeGreaterThan(daysFromNow(6.9).getTime());
    expect(invitation.expiresAt.getTime()).toBeLessThan(daysFromNow(7.1).getTime());

    const [email] = await outbox();
    expect(email).toMatchObject({ to: invitedEmail, organizationId: organization.organizationId });
    expect(email!.subject).toContain(organization.organizationName);
    expect(email!.html).toContain(`/invitacion/${invitation.id}`);

    expect(await listPendingInvitations(organization.organizationId)).toEqual([
      {
        id: invitation.id,
        email: invitedEmail,
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ]);
    expect(await countAuditLogs(organization.organizationId, "Invitation")).toBe(1);
  });

  it("no invita dos veces ni a quien ya es miembro", async () => {
    await invite();
    await expect(invite()).rejects.toMatchObject({ status: 409 });
    const member = await createMember(organization);
    await expect(invite(member.userEmail)).rejects.toMatchObject({ status: 409 });
  });

  it("reenviar manda otro email con el mismo link y el mismo vencimiento, sin duplicar la invitación", async () => {
    const invited = await invite();
    const before = await prisma.invitation.findUniqueOrThrow({ where: { id: invited.id } });
    const resent = await asOrganization(organization, () => resendInvitation(admin, invited.id));
    expect(resent).toEqual(invited);
    const emails = await outbox();
    expect(emails).toHaveLength(2);
    expect(emails[1]!.html).toContain(`/invitacion/${before.id}`);
    expect(await prisma.invitation.count()).toBe(1);
    const after = await prisma.invitation.findUniqueOrThrow({ where: { id: before.id } });
    expect(after.expiresAt).toEqual(before.expiresAt);
  });

  it("cancelar la deja sin servir y no se reenvía; otra organización no la ve", async () => {
    const invited = await invite();
    const other = await createOrganization();
    const otherAdmin = await actorOf(other);
    await expect(
      asOrganization(other, () => cancelInvitation(otherAdmin, invited.id)),
    ).rejects.toMatchObject({ status: 404 });

    await asOrganization(organization, () => cancelInvitation(admin, invited.id));
    expect(await listPendingInvitations(organization.organizationId)).toEqual([]);
    await expect(
      asOrganization(organization, () => resendInvitation(admin, invited.id)),
    ).rejects.toMatchObject({ status: 404 });
    const invitee = await registerInvitee();
    expect((await getInvitation(invitee.auth, invited.id)).status).toBe("CANCELED");
  });
});

describe("leer y resolver la invitación", () => {
  it("dice organización, estado y si es para el email de la sesión; vencida es EXPIRED", async () => {
    const invited = await invite();
    const invitee = await registerInvitee();
    expect(await getInvitation(invitee.auth, invited.id)).toEqual({
      id: invited.id,
      organizationName: organization.organizationName,
      status: "PENDING",
      expiresAt: expect.any(String),
      forCurrentUser: true,
    });
    expect((await getInvitation(admin.auth, invited.id)).forCurrentUser).toBe(false);
    await expect(getInvitation(admin.auth, "no-existe")).rejects.toMatchObject({ status: 404 });

    await prisma.invitation.update({
      where: { id: invited.id },
      data: { expiresAt: daysFromNow(-1) },
    });
    expect((await getInvitation(invitee.auth, invited.id)).status).toBe("EXPIRED");
    await expect(acceptInvitation(invitee, invited.id)).rejects.toMatchObject({ status: 400 });
  });

  it("aceptar hace miembro, vuelve a la organización propia y solo lo hace el invitado", async () => {
    const invited = await invite();
    const stranger = await registerInvitee("otra@test.local");
    await expect(acceptInvitation(stranger, invited.id)).rejects.toMatchObject({ status: 403 });

    const invitee = await registerInvitee();
    expect(await acceptInvitation(invitee, invited.id)).toEqual({
      organizationName: organization.organizationName,
    });
    expect(await listOrganizationsOf(invitee.auth.userId)).toEqual([
      expect.objectContaining({ id: invitee.auth.organizationId, role: "owner" }),
      expect.objectContaining({ id: organization.organizationId, role: "member" }),
    ]);
    const session = await getAuthContext(invitee.headers);
    expect(session?.organizationId).toBe(invitee.auth.organizationId);
    expect((await listMembers(organization.organizationId)).map((member) => member.role)).toEqual([
      "owner",
      "member",
    ]);
    expect((await getInvitation(invitee.auth, invited.id)).status).toBe("ACCEPTED");
    await expect(acceptInvitation(invitee, invited.id)).rejects.toMatchObject({ status: 400 });
  });

  it("rechazar la deja rechazada sin crear la membresía", async () => {
    const invited = await invite();
    const invitee = await registerInvitee();
    expect(await rejectInvitation(invitee, invited.id)).toEqual({
      organizationName: organization.organizationName,
    });
    expect((await getInvitation(invitee.auth, invited.id)).status).toBe("REJECTED");
    expect(await listMembers(organization.organizationId)).toHaveLength(1);
  });
});
