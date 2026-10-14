"use client";

import type { MeDto } from "@repo/api/client";
import type { MemberRole } from "@repo/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@repo/ui/components/sidebar";
import { HomeIcon, LayoutGridIcon, Settings2Icon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { useMe } from "@/hooks/use-me";
import { productName } from "@/lib/product";

import { NavUser } from "./nav-user";
import { useOrganizationSwitch } from "./organization-switch-provider";
import { OrganizationSwitcher } from "./organization-switcher";

// Sin más de una organización no hay nada que elegir: la barra queda con la marca del
// producto, con link al inicio.
function AppIdentity() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link href="/" />}>
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <LayoutGridIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{productName}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

const navigation = [
  { title: "Inicio", href: "/", icon: HomeIcon, visibleFor: null },
  { title: "Configuración", href: "/configuracion", icon: Settings2Icon, visibleFor: "owner" },
  { title: "Mi perfil", href: "/mi-perfil", icon: UserIcon, visibleFor: null },
] as const;

const isActivePath = (pathname: string, href: string) =>
  href === "/" ? pathname === href : pathname.startsWith(href);

export function AppSidebar({
  role,
  me,
  ...props
}: ComponentProps<typeof Sidebar> & { role: MemberRole; me: MeDto }) {
  const pathname = usePathname();
  const { data: activeMe = me } = useMe(me);
  const { isSwitching } = useOrganizationSwitch();
  // Configuración es del Administrador de la organización activa; un miembro de una
  // organización ajena no la ve.
  const visibleNavigation = navigation.filter(
    (item) => item.visibleFor === null || item.visibleFor === role,
  );
  const hasMultipleOrganizations = activeMe.organizations.length > 1;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {hasMultipleOrganizations ? <OrganizationSwitcher initialMe={me} /> : <AppIdentity />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {/* Mientras cambia de organización, el rol y el nombre en pantalla siguen siendo
                los de la anterior hasta que el layout autenticado vuelve a renderizar: un
                esqueleto ocupa el lugar del menú en vez de arriesgar a mostrarlos. */}
            {isSwitching
              ? visibleNavigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))
              : visibleNavigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActivePath(pathname, item.href)}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isSwitching ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          // `activeMe` viene de la base, no de la cookie de sesión: un cambio hecho en Mi
          // perfil se ve acá sin recargar.
          <NavUser user={{ name: activeMe.userName, email: activeMe.userEmail }} />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
