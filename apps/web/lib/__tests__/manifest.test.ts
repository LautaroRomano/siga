import { describe, expect, it } from "vitest";

import { appIconMetadata, buildManifest } from "@/lib/manifest";
import { productName } from "@/lib/product";

describe("manifest", () => {
  it("usa el nombre del producto, abre en el inicio y lleva los íconos por defecto", () => {
    const manifest = buildManifest();
    expect(manifest).toMatchObject({
      name: productName,
      short_name: productName,
      display: "standalone",
      start_url: "/",
      lang: "es-AR",
    });
    expect(manifest.icons?.map((item) => item.src)).toEqual([
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/icon-maskable-512.png",
    ]);
  });

  it("la metadata de la app apunta al manifest y a los íconos estáticos", () => {
    expect(appIconMetadata).toEqual({
      manifest: "/manifest.webmanifest",
      icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
    });
  });
});
