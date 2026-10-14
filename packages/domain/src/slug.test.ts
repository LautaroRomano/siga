import { describe, expect, it } from "vitest";

import { slugify, slugSchema, uniqueSlug } from "./slug";

describe("slug", () => {
  it("normaliza acentos, espacios y símbolos", () => {
    expect(slugify("Organización Centro")).toBe("organizacion-centro");
    expect(slugify("  María José Núñez  ")).toBe("maria-jose-nunez");
    expect(slugify("¡¡¡")).toBe("");
  });

  it("agrega un sufijo numérico cuando la base ya está tomada", () => {
    expect(uniqueSlug("centro", [])).toBe("centro");
    expect(uniqueSlug("centro", ["centro"])).toBe("centro-2");
    expect(uniqueSlug("centro", ["centro", "centro-2"])).toBe("centro-3");
    expect(uniqueSlug("", [])).toBe("link");
  });

  it("valida el formato del slug y baja a minúsculas", () => {
    expect(slugSchema.parse(" Mi-Org ")).toBe("mi-org");
    expect(slugSchema.safeParse("mi org").success).toBe(false);
    expect(slugSchema.safeParse("-org").success).toBe(false);
    expect(slugSchema.safeParse("a").success).toBe(false);
  });
});
