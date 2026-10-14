import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

const googleSansMock = vi.fn(() => ({
  className: "google-sans-mock",
  variable: "--font-google-sans",
  style: { fontFamily: "mock" },
}));

vi.mock("next/font/google", () => ({ Google_Sans: googleSansMock }));

describe("fuente Google Sans", () => {
  it("carga la familia con eje variable, subsets, estilo y display definidos", async () => {
    const { GOOGLE_SANS_VARIABLE } = await import("../fonts");

    expect(googleSansMock).toHaveBeenCalledWith({
      weight: "variable",
      style: "normal",
      subsets: ["latin", "latin-ext"],
      display: "swap",
      fallback: ["system-ui", "sans-serif"],
      variable: GOOGLE_SANS_VARIABLE,
    });
  });

  it("los tokens --font-sans y --font-heading apuntan a la variable de Google Sans", async () => {
    const { GOOGLE_SANS_VARIABLE } = await import("../fonts");
    const globalsCssPath = resolve(
      import.meta.dirname,
      "../../../../packages/ui/src/styles/globals.css",
    );
    const globalsCss = readFileSync(globalsCssPath, "utf-8");

    expect(globalsCss).toContain(`--font-sans: var(${GOOGLE_SANS_VARIABLE});`);
    expect(globalsCss).toContain(`--font-heading: var(${GOOGLE_SANS_VARIABLE});`);
  });
});
