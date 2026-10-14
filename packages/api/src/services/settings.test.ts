import { prisma } from "@repo/db";
import { beforeEach, describe, expect, it } from "vitest";

import { createOrganization, resetDatabase, type TestOrganization } from "../test/db";

import { getSettings, updateSettings } from "./settings";

let organization: TestOrganization;

beforeEach(async () => {
  await resetDatabase();
  organization = await createOrganization();
});

describe("ajustes", () => {
  it("arranca con el nombre de la organización y sin fila de ajustes", async () => {
    expect(await getSettings(organization.organizationId)).toEqual({
      name: organization.organizationName,
    });
    expect(await prisma.organizationSettings.count()).toBe(0);
  });

  it("renombra la organización y crea la fila de ajustes una sola vez", async () => {
    expect(await updateSettings(organization.organizationId, { name: "Organización QA" })).toEqual({
      name: "Organización QA",
    });
    expect(await updateSettings(organization.organizationId, {})).toEqual({
      name: "Organización QA",
    });
    expect(await prisma.organizationSettings.count()).toBe(1);
    expect((await getSettings(organization.organizationId)).name).toBe("Organización QA");
  });
});
