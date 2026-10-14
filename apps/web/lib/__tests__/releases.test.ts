import { describe, expect, it } from "vitest";

import { currentRelease, formatVersionLabel, formatVersionName, releases } from "@/lib/releases";

describe("releases", () => {
  it("arma el nombre de versión con etapa y número", () => {
    expect(formatVersionName({ stage: "Alpha", number: "0.0" })).toBe("Alpha 0.0");
    expect(formatVersionLabel({ stage: "Alpha", number: "0.0" })).toBe("Versión Alpha 0.0");
  });

  it("sin etapa muestra solo el número", () => {
    expect(formatVersionName({ stage: "", number: "1.0" })).toBe("1.0");
    expect(formatVersionLabel({ stage: "  ", number: "1.0" })).toBe("Versión 1.0");
  });

  it("la versión actual es la primera entrada del archivo", () => {
    expect(currentRelease).toBe(releases[0]);
  });

  it("toda versión publicada tiene número, fecha y una lista de cambios (puede estar vacía)", () => {
    expect(releases.length).toBeGreaterThan(0);
    for (const release of releases) {
      expect(release.number).toMatch(/^\d+\.\d+$/);
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(release.changes)).toBe(true);
    }
  });
});
