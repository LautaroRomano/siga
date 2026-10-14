import { prisma, runWithAuditActor, type AuditActor } from "@repo/db";

import { findOwnedOrganizationId } from "../services/memberships";

const tables = [
  "audit_log",
  "email_outbox",
  "rate_limit_bucket",
  "organization_settings",
  "invitation",
  "member",
  "organization",
  "verification",
  "account",
  "session",
  '"user"',
];

export const resetDatabase = async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.join(", ")} CASCADE`);
};

export type TestOrganization = {
  userId: string;
  userEmail: string;
  organizationId: string;
  organizationName: string;
  actor: AuditActor;
};

// Una cuenta con su organización propia, donde es Administrador.
export const createOrganization = async (
  suffix = crypto.randomUUID().slice(0, 8),
): Promise<TestOrganization> => {
  const user = await prisma.user.create({
    data: { id: `user-${suffix}`, name: `Usuario ${suffix}`, email: `${suffix}@test.local` },
  });
  const organization = await prisma.organization.create({
    data: {
      id: `org-${suffix}`,
      name: `Organización ${suffix}`,
      slug: `organizacion-${suffix}`,
      createdAt: new Date(),
      members: {
        create: { id: `member-${suffix}`, userId: user.id, role: "owner", createdAt: new Date() },
      },
    },
  });
  return {
    userId: user.id,
    userEmail: user.email,
    organizationId: organization.id,
    organizationName: organization.name,
    actor: { userId: user.id, organizationId: organization.id },
  };
};

export const asOrganization = <T>(organization: TestOrganization, fn: () => Promise<T>) =>
  runWithAuditActor(organization.actor, fn);

export const countAuditLogs = (organizationId: string, entity?: string) =>
  prisma.auditLog.count({ where: { organizationId, ...(entity ? { entity } : {}) } });

// Sesión real de Better Auth para llamar a `auth.api.*` desde los tests: el plugin bearer
// firma el token y lo convierte en cookie de sesión.
export const signInAs = async (userId: string, activeOrganizationId?: string) => {
  const token = crypto.randomUUID().replaceAll("-", "");
  const now = new Date();
  await prisma.session.create({
    data: {
      id: `session-${token.slice(0, 12)}`,
      token,
      userId,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      activeOrganizationId: activeOrganizationId ?? (await findOwnedOrganizationId(userId)),
    },
  });
  return new Headers({ authorization: `Bearer ${token}` });
};

// Una cuenta con organización propia que además es miembro de `organization`.
export const createMember = async (
  organization: TestOrganization,
  suffix = crypto.randomUUID().slice(0, 8),
): Promise<TestOrganization> => {
  const own = await createOrganization(suffix);
  await prisma.member.create({
    data: {
      id: `member-${organization.organizationId}-${suffix}`,
      organizationId: organization.organizationId,
      userId: own.userId,
      role: "member",
      createdAt: new Date(),
    },
  });
  return own;
};
