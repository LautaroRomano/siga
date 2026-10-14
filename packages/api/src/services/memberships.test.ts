import { getAuthContext } from "@repo/auth";
import { prisma } from "@repo/db";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createMember,
  createOrganization,
  resetDatabase,
  signInAs,
  type TestOrganization,
} from "../test/db";

import {
  findOwnedOrganizationId,
  listMembers,
  listOrganizationsOf,
  removeMembership,
} from "./memberships";

let organization: TestOrganization;

beforeEach(async () => {
  await resetDatabase();
  organization = await createOrganization();
});

describe("membresías", () => {
  it("lista los miembros con el Administrador primero y nombre y email de la cuenta", async () => {
    const member = await createMember(organization);
    await prisma.member.update({
      where: {
        organizationId_userId: {
          organizationId: organization.organizationId,
          userId: organization.userId,
        },
      },
      data: { createdAt: new Date(Date.now() + 60_000) },
    });
    expect(await listMembers(organization.organizationId)).toEqual([
      expect.objectContaining({
        userId: organization.userId,
        role: "owner",
        email: organization.userEmail,
      }),
      expect.objectContaining({
        userId: member.userId,
        role: "member",
        name: `Usuario ${member.userId.slice(5)}`,
      }),
    ]);
  });

  it("la organización propia es donde la cuenta es Administrador", async () => {
    const member = await createMember(organization);
    expect(await findOwnedOrganizationId(member.userId)).toBe(member.organizationId);
    await expect(findOwnedOrganizationId("nadie")).rejects.toMatchObject({ status: 404 });
    expect(await listOrganizationsOf(member.userId)).toEqual([
      expect.objectContaining({ id: member.organizationId, role: "owner" }),
      expect.objectContaining({ id: organization.organizationId, role: "member" }),
    ]);
  });

  it("quitar un miembro con la organización ajena activa lo devuelve a la propia nombrando la que dejó", async () => {
    const member = await createMember(organization);
    const headers = await signInAs(member.userId, organization.organizationId);
    expect((await getAuthContext(headers))?.organizationId).toBe(organization.organizationId);

    await removeMembership(organization.organizationId, member.userId);
    expect(await listMembers(organization.organizationId)).toHaveLength(1);
    expect(await getAuthContext(headers)).toMatchObject({
      organizationId: member.organizationId,
      role: "owner",
      lostOrganization: { id: organization.organizationId, name: organization.organizationName },
    });
  });

  it("no quita al Administrador ni a quien no es miembro", async () => {
    await expect(
      removeMembership(organization.organizationId, organization.userId),
    ).rejects.toMatchObject({ status: 400 });
    await expect(removeMembership(organization.organizationId, "nadie")).rejects.toMatchObject({
      status: 404,
    });
  });
});
