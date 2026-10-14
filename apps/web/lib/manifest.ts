import type { MetadataRoute } from "next";

import { productDescription, productName } from "./product";

export const manifestPath = "/manifest.webmanifest";
export const faviconPath = "/icons/icon-192.png";
export const appleIconPath = "/icons/apple-touch-icon.png";

export const appIconMetadata = {
  manifest: manifestPath,
  icons: { icon: faviconPath, apple: appleIconPath },
};

export const buildManifest = (): MetadataRoute.Manifest => ({
  name: productName,
  short_name: productName,
  description: productDescription,
  start_url: "/",
  display: "standalone",
  orientation: "portrait",
  lang: "es-AR",
  background_color: "#ffffff",
  theme_color: "#ffffff",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
});
