import { describe, expect, it } from "vitest";

import { updateSettingsSchema } from "./settings";

describe("updateSettingsSchema", () => {
  it("permite omitir el nombre", () => {
    expect(updateSettingsSchema.parse({})).toEqual({});
  });

  it("recorta espacios del nombre y acepta hasta 100 caracteres", () => {
    expect(updateSettingsSchema.parse({ name: "  Organización QA  " })).toEqual({
      name: "Organización QA",
    });
    expect(updateSettingsSchema.safeParse({ name: "a".repeat(100) }).success).toBe(true);
    expect(updateSettingsSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });

  it("rechaza un nombre vacío o de solo espacios", () => {
    expect(updateSettingsSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});
