import type { Viewport } from "next";

// maximumScale + userScalable bloquean el pinch-zoom (Chrome Android e iOS en modo
// standalone). Safari en pestaña los ignora: ahí el doble toque lo frena
// `touch-action: manipulation` en <html> (ver docs/pwa.md).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};
