import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "./profile";

describe("updateProfileSchema", () => {
  it("recorta espacios y acepta hasta 120 caracteres", () => {
    expect(updateProfileSchema.parse({ name: "  Ana Pérez  " })).toEqual({ name: "Ana Pérez" });
    expect(updateProfileSchema.safeParse({ name: "a".repeat(120) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ name: "a".repeat(121) }).success).toBe(false);
  });

  it("rechaza un nombre vacío o de solo espacios con su mensaje", () => {
    const result = updateProfileSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe("Ingresá tu nombre");
  });
});
