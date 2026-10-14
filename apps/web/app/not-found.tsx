import type { Metadata } from "next";

import { NeutralNotFound } from "@/components/errors/not-found";

export const metadata: Metadata = {
  title: "No encontramos esa página",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <NeutralNotFound />
    </main>
  );
}
