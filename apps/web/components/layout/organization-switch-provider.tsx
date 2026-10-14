"use client";

import { authClient } from "@repo/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { homePath, resetForNewOrganization } from "@/lib/organization-switch";

type OrganizationSwitch = {
  isSwitching: boolean;
  switchOrganization: (organizationId: string, next?: Route) => void;
};

// `isSwitching` nace en el mismo clic, antes de cualquier respuesta de red: `startTransition`
// lo marca en el momento de llamar, y sigue así durante todo el `router.refresh()` que arma
// `resetForNewOrganization`, hasta que el layout autenticado vuelve a renderizar con la
// organización nueva. Si `setActive` falla no se toca la caché ni se navega: la organización
// activa no cambió, así que alcanza con avisar y volver a habilitar la UI.
const useOrganizationSwitchState = (): OrganizationSwitch => {
  const [isSwitching, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const router = useRouter();

  const switchOrganization = useCallback(
    (organizationId: string, next: Route = homePath) => {
      startTransition(async () => {
        const { error } = await authClient.organization.setActive({ organizationId });
        if (error) {
          toast.error("No se pudo cambiar de organización");
          return;
        }
        resetForNewOrganization(queryClient, router, next);
      });
    },
    [queryClient, router],
  );

  return { isSwitching, switchOrganization };
};

const OrganizationSwitchContext = createContext<OrganizationSwitch | null>(null);

// Un solo Provider en `app/(app)/layout.tsx` hace que el selector de la barra lateral y el
// resto del shell compartan el mismo estado: el clic en el selector lo ve todo el resto. `useOrganizationSwitch` exige este
// Provider (los tests de estos consumidores lo montan, ver `test/render`).
export function OrganizationSwitchProvider({ children }: { children: ReactNode }) {
  const value = useOrganizationSwitchState();
  return (
    <OrganizationSwitchContext.Provider value={value}>
      {children}
    </OrganizationSwitchContext.Provider>
  );
}

export function useOrganizationSwitch(): OrganizationSwitch {
  const context = useContext(OrganizationSwitchContext);
  if (!context) {
    throw new Error("useOrganizationSwitch debe usarse dentro de OrganizationSwitchProvider");
  }
  return context;
}
