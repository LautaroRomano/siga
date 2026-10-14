"use client";

import type { MeDto, MyOrganizationDto } from "@repo/api/client";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { Spinner } from "@repo/ui/components/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

import { useOrganizationSwitch } from "@/components/layout/organization-switch-provider";
import { useMe } from "@/hooks/use-me";
import { sortOrganizations } from "@/lib/organizations";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const legendOf = (role: MyOrganizationDto["role"]) =>
  role === "owner" ? "Tu organización" : "Como miembro";

function OrganizationMenu({
  organizations,
  active,
}: {
  organizations: MyOrganizationDto[];
  active: MyOrganizationDto;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { isSwitching, switchOrganization } = useOrganizationSwitch();
  // Controlado a mano: seleccionar una organización dispara `router.refresh()`, y ese
  // re-render puede llegar antes de que el cierre automático del menú termine su propia
  // limpieza (devolver el foco al gatillo), dejándolo "abierto" para Base UI aunque no se vea
  // más — el clic siguiente lo interpreta como "cerrar" en vez de "abrir" y el ítem recién
  // montado se desmonta a mitad del click de Playwright. Cerrarlo acá, ya, evita la carrera.
  const [open, setOpen] = useState(false);

  const switchTo = (organizationId: string) => {
    if (organizationId === active.id) return;
    setOpenMobile(false);
    setOpen(false);
    switchOrganization(organizationId);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              data-testid="organization-switcher-trigger"
              disabled={isSwitching}
              render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
            />
          }
        >
          <Avatar>
            <AvatarFallback>{initials(active.name)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{active.name}</span>
            <span className="truncate text-xs">{legendOf(active.role)}</span>
          </div>
          {isSwitching ? (
            <Spinner className="ml-auto" />
          ) : (
            <ChevronsUpDownIcon className="ml-auto size-4" />
          )}
        </TooltipTrigger>
        {/* El botón trunca el nombre en una línea; acá se lee completo. */}
        <TooltipContent side={isMobile ? "bottom" : "right"}>{active.name}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className="w-(--anchor-width) min-w-56"
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={4}
      >
        <DropdownMenuRadioGroup value={active.id} onValueChange={switchTo}>
          <DropdownMenuLabel>Organización</DropdownMenuLabel>
          {organizations.map((organization) => (
            <DropdownMenuRadioItem key={organization.id} value={organization.id}>
              <Avatar size="sm">
                <AvatarFallback>{initials(organization.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="line-clamp-2 break-words">{organization.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {legendOf(organization.role)}
                </span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrganizationSwitcher({ initialMe }: { initialMe: MeDto }) {
  const { data: me = initialMe } = useMe(initialMe);

  if (me.organizations.length < 2) return null;
  const organizations = sortOrganizations(me.organizations);
  const active = organizations.find((organization) => organization.id === me.organizationId);
  if (!active) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <OrganizationMenu organizations={organizations} active={active} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
