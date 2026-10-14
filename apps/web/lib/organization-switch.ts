import type { QueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import type { useRouter } from "next/navigation";

type Router = Pick<ReturnType<typeof useRouter>, "push" | "refresh">;

export const homePath: Route = "/";

// Cambiar de organización deja atrás todo lo cacheado de la anterior: se limpia React Query y
// se vuelve al inicio; `refresh` hace que el layout autenticado vuelva a leer la sesión en el
// servidor. `OrganizationSwitchProvider` (components/layout) llama a esto recién si `setActive`
// no falló, dentro de una transición que mantiene la carga visible hasta que el `refresh`
// termina. Si el producto guarda filtros por dispositivo, este es el lugar para limpiarlos.
export const resetForNewOrganization = (
  queryClient: Pick<QueryClient, "clear">,
  router: Router,
  next: Route = homePath,
) => {
  queryClient.clear();
  router.push(next);
  router.refresh();
};
