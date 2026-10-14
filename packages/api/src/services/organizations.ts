import { prisma } from "@repo/db";

export const findOrganizationName = (organizationId: string) =>
  prisma.organization
    .findUniqueOrThrow({ where: { id: organizationId }, select: { name: true } })
    .then((organization) => organization.name);

export const renameOrganization = (organizationId: string, name: string) =>
  prisma.organization
    .update({ where: { id: organizationId }, data: { name } })
    .then((organization) => organization.name);
