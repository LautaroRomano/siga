import "@repo/ui/globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { googleSans } from "@/lib/fonts";
import { appIconMetadata } from "@/lib/manifest";
import { productDescription, productName } from "@/lib/product";

import { Providers } from "./providers";

export { viewport } from "@/lib/viewport";

export const metadata: Metadata = {
  applicationName: productName,
  title: { default: productName, template: `%s · ${productName}` },
  description: productDescription,
  ...appIconMetadata,
  appleWebApp: { capable: true, statusBarStyle: "default", title: productName },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es-AR"
      suppressHydrationWarning
      className={`${googleSans.variable} touch-manipulation`}
    >
      <body className="min-h-dvh overscroll-none antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
