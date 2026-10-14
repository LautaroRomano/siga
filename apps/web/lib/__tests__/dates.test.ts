import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime } from "../dates";

describe("fechas en es-AR", () => {
  it("formatea la fecha en español", () => {
    expect(formatDate(new Date(2026, 8, 10))).toBe("10 sep 2026");
    expect(formatDate("2026-09-10T00:00:00", "EEEE d 'de' MMMM")).toBe("jueves 10 de septiembre");
  });

  it("formatea fecha y hora en 24 horas", () => {
    expect(formatDateTime(new Date(2026, 8, 10, 14, 30))).toBe("10 sep 2026, 14:30");
  });
});
