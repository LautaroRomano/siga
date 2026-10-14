import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { InvitationCard } from "@/components/invitations/invitation-card";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Invitación" };

export default async function InvitationPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireSession()]);
  return (
    <AuthShell>
      <InvitationCard id={id} userEmail={session.userEmail} />
    </AuthShell>
  );
}
