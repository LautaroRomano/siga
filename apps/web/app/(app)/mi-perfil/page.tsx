import type { Metadata } from "next";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSection } from "@/components/profile/profile-section";
import { getMeCached } from "@/lib/me-cache";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function MyProfilePage() {
  const session = await requireSession();
  const me = await getMeCached(session);

  return (
    <>
      <PageHeader title="Mi perfil" />
      <PageBody>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
          <ProfileSection initialMe={me} />
        </div>
      </PageBody>
    </>
  );
}
