import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { LostOrganizationNotice } from "@/components/layout/lost-organization-notice";
import { OrganizationSwitchContent } from "@/components/layout/organization-switch-content";
import { OrganizationSwitchProvider } from "@/components/layout/organization-switch-provider";
import { getMeCached } from "@/lib/me-cache";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const me = await getMeCached(session);

  return (
    <OrganizationSwitchProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar role={session.role} me={me} />
        <SidebarInset className="h-svh min-w-0 overflow-hidden">
          <LostOrganizationNotice me={me} />
          <OrganizationSwitchContent>{children}</OrganizationSwitchContent>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationSwitchProvider>
  );
}
