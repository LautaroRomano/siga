import type { Metadata } from "next";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { productName } from "@/lib/product";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage() {
  const session = await requireSession();

  return (
    <>
      <PageHeader title="Inicio" />
      <PageBody>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 p-4">
          <h2 className="text-2xl font-semibold">{productName}</h2>
          <p className="text-muted-foreground text-sm">Hola, {session.userName}.</p>
        </div>
      </PageBody>
    </>
  );
}
