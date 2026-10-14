import { prisma } from "@repo/db";
import type { UpdateSettingsInput } from "@repo/domain";

import type { SettingsDto } from "../schemas";

import { findOrganizationName, renameOrganization } from "./organizations";

// El nombre vive en `Organization`; el resto de las preferencias, en `OrganizationSettings`,
// que nace con el primer PATCH. El producto suma acá sus propios campos.
export const getSettings = async (organizationId: string): Promise<SettingsDto> => ({
  name: await findOrganizationName(organizationId),
});

export const updateSettings = async (
  organizationId: string,
  input: UpdateSettingsInput,
): Promise<SettingsDto> => {
  const { name } = input;
  await prisma.organizationSettings.upsert({
    where: { organizationId },
    create: { organizationId },
    update: {},
  });
  return {
    name:
      name === undefined
        ? await findOrganizationName(organizationId)
        : await renameOrganization(organizationId, name),
  };
};
