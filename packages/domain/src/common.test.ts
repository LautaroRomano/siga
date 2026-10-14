import { describe, expect, it } from "vitest";

import { isoDate, isoDateTime, optionalEmail, optionalText, paginationQuerySchema } from "./common";

describe("helpers comunes", () => {
  it("optionalText recorta y convierte vacío en null", () => {
    const schema = optionalText(10);
    expect(schema.parse("  hola  ")).toBe("hola");
    expect(schema.parse("")).toBeNull();
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.safeParse("demasiado largo!!").success).toBe(false);
  });

  it("optionalEmail valida solo cuando hay valor", () => {
    expect(optionalEmail.parse("")).toBeNull();
    expect(optionalEmail.parse("a@b.co")).toBe("a@b.co");
    expect(optionalEmail.safeParse("no").success).toBe(false);
  });

  it("fechas ISO", () => {
    expect(isoDate.safeParse("2024-02-30").success).toBe(false);
    expect(isoDate.safeParse("2024-02-28").success).toBe(true);
    expect(isoDateTime.safeParse("2026-09-10T14:00:00.000Z").success).toBe(true);
    expect(isoDateTime.safeParse("2026-09-10 14:00").success).toBe(false);
  });

  it("paginación con defaults y coerción", () => {
    const query = paginationQuerySchema.parse({ limit: "10" });
    expect(query.limit).toBe(10);
    expect(paginationQuerySchema.parse({}).limit).toBe(25);
    expect(paginationQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });
});
