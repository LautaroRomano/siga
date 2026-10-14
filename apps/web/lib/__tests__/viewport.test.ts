import { describe, expect, it } from "vitest";

import { viewport } from "../viewport";

describe("viewport", () => {
  it("bloquea el zoom del usuario manteniendo el ancho del dispositivo", () => {
    expect(viewport).toMatchObject({
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      viewportFit: "cover",
    });
  });
});
