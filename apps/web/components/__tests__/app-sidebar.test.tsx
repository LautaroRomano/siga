import type { MeDto } from "@repo/api/client";
import { SidebarProvider } from "@repo/ui/components/sidebar";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { OrganizationSwitchProvider } from "@/components/layout/organization-switch-provider";
import { productName } from "@/lib/product";
import { renderWithProviders } from "@/test/render";

const routerSpies = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const setActive = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const pathnameState = vi.hoisted(() => ({ current: "/" }));

vi.mock("@/hooks/use-me", () => ({
  useMe: (initialData: MeDto) => ({ data: initialData }),
}));

vi.mock("@repo/auth/client", () => ({
  authClient: { organization: { setActive } },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
  useRouter: () => routerSpies,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Promesa controlada a mano: deja observar el estado mientras `setActive` todavía no
// respondió, algo que un mock ya resuelto no permite.
const pendingSetActive = () => {
  let resolve!: (value: { error?: unknown }) => void;
  const promise = new Promise<{ error?: unknown }>((res) => {
    resolve = res;
  });
  setActive.mockReturnValueOnce(promise);
  return resolve;
};

const user = { name: "Ana Demo", email: "demo@example.com" };

const ownOrganization = {
  id: "org-own",
  name: "Organización de Demo",
  slug: "demo",
  role: "owner" as const,
};

const otherOrganization = {
  id: "org-otra",
  name: "Organización Norte",
  slug: "norte",
  role: "member" as const,
};

const meOf = (organizations: MeDto["organizations"] = [ownOrganization]): MeDto => ({
  userId: "u1",
  userName: user.name,
  userEmail: user.email,
  organizationId: organizations[0].id,
  role: "owner",
  organizations,
  lostOrganization: null,
});

const renderSidebar = (role: "owner" | "member" = "owner", me: MeDto = meOf()) =>
  renderWithProviders(
    <OrganizationSwitchProvider>
      <SidebarProvider>
        <AppSidebar role={role} me={me} />
      </SidebarProvider>
    </OrganizationSwitchProvider>,
  );

beforeEach(() => {
  pathnameState.current = "/";
  routerSpies.push.mockClear();
  routerSpies.refresh.mockClear();
  setActive.mockClear();
});

describe("AppSidebar", () => {
  it("muestra Inicio, Configuración y Mi perfil al Administrador, con Inicio activo solo en la raíz", () => {
    renderSidebar("owner");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("data-active");
    expect(screen.getByRole("link", { name: "Configuración" })).toHaveAttribute(
      "href",
      "/configuracion",
    );
    expect(screen.getByRole("link", { name: "Mi perfil" })).toHaveAttribute("href", "/mi-perfil");
  });

  it("un miembro no ve Configuración, pero sí Inicio y Mi perfil", () => {
    pathnameState.current = "/mi-perfil";
    renderSidebar("member");
    expect(screen.queryByRole("link", { name: "Configuración" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("data-active");
    expect(screen.getByRole("link", { name: "Mi perfil" })).toHaveAttribute("data-active");
  });

  it("el pie muestra el nombre y el email de quién soy, no de la cookie", () => {
    renderSidebar("owner", { ...meOf(), userName: "Nombre actualizado" });
    expect(screen.getByText("Nombre actualizado")).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    expect(screen.queryByText(user.name)).not.toBeInTheDocument();
  });

  it("con una sola organización muestra la marca del producto con link al inicio, nunca un selector", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: productName })).toHaveAttribute("href", "/");
    expect(screen.queryByTestId("organization-switcher-trigger")).not.toBeInTheDocument();
  });

  it("con más de una organización muestra solo el selector, nunca la marca del producto", () => {
    renderSidebar("owner", meOf([ownOrganization, otherOrganization]));
    expect(screen.getByTestId("organization-switcher-trigger")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: productName })).not.toBeInTheDocument();
  });
});

describe("AppSidebar: selector de organización", () => {
  it("lista la propia primera y marca la activa", async () => {
    renderSidebar("owner", meOf([ownOrganization, otherOrganization]));
    const trigger = screen.getByTestId("organization-switcher-trigger");
    expect(trigger).toHaveTextContent("Organización de Demo");
    expect(trigger).toHaveTextContent("Tu organización");

    await userEvent.click(trigger);
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitemradio");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Organización de Demo");
    expect(items[0]).toHaveTextContent("Tu organización");
    expect(items[0]).toBeChecked();
    expect(items[1]).toHaveTextContent("Organización Norte");
    expect(items[1]).toHaveTextContent("Como miembro");
    expect(items[1]).not.toBeChecked();
  });

  it("el botón trunca el nombre; enfocarlo lo muestra completo en un tooltip", async () => {
    const longName = "Organización de un nombre bien largo que no entra en la barra lateral";
    renderSidebar("owner", meOf([{ ...ownOrganization, name: longName }, otherOrganization]));
    const trigger = screen.getByTestId("organization-switcher-trigger");
    trigger.focus();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent(longName),
    );
  });

  it("el menú desplegado deja el nombre en hasta dos líneas, sin truncarlo", async () => {
    const longName = "Organización de un nombre bien largo que no entra en la barra lateral";
    renderSidebar("owner", meOf([{ ...ownOrganization, name: longName }, otherOrganization]));
    await userEvent.click(screen.getByTestId("organization-switcher-trigger"));
    const menu = await screen.findByRole("menu");
    const ownName = within(menu).getByText(longName);
    expect(ownName).toHaveClass("line-clamp-2");
    expect(ownName).not.toHaveClass("truncate");
  });

  it("elegir una ajena activa la sesión en ella, limpia la caché y va al inicio", async () => {
    const { queryClient } = renderSidebar("owner", meOf([ownOrganization, otherOrganization]));
    const clear = vi.spyOn(queryClient, "clear");

    await userEvent.click(screen.getByTestId("organization-switcher-trigger"));
    const menu = await screen.findByRole("menu");
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: /Organización Norte/ }));

    await vi.waitFor(() => expect(routerSpies.refresh).toHaveBeenCalledOnce());
    expect(setActive).toHaveBeenCalledWith({ organizationId: "org-otra" });
    expect(clear).toHaveBeenCalledOnce();
    expect(routerSpies.push).toHaveBeenCalledWith("/");
  });
});

describe("AppSidebar: carga al cambiar de organización", () => {
  it("aparece ya, antes de que responda la red, deshabilita el selector y oculta el menú anterior", async () => {
    const resolveSetActive = pendingSetActive();
    renderSidebar("owner", meOf([ownOrganization, otherOrganization]));

    await userEvent.click(screen.getByTestId("organization-switcher-trigger"));
    const menu = await screen.findByRole("menu");
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: /Organización Norte/ }));

    expect(setActive).toHaveBeenCalledWith({ organizationId: "org-otra" });
    // Todavía no respondió la red: nada se refrescó ni navegó.
    expect(routerSpies.refresh).not.toHaveBeenCalled();
    expect(screen.getByTestId("organization-switcher-trigger")).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Configuración" })).not.toBeInTheDocument();

    resolveSetActive({});
    await waitFor(() => expect(routerSpies.refresh).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByTestId("organization-switcher-trigger")).toBeEnabled());
    expect(screen.getByRole("link", { name: "Configuración" })).toBeInTheDocument();
  });

  it("si falla, avisa con un toast, no navega y deja todo como estaba", async () => {
    const resolveSetActive = pendingSetActive();
    renderSidebar("owner", meOf([ownOrganization, otherOrganization]));

    await userEvent.click(screen.getByTestId("organization-switcher-trigger"));
    const menu = await screen.findByRole("menu");
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: /Organización Norte/ }));
    expect(screen.getByTestId("organization-switcher-trigger")).toBeDisabled();

    resolveSetActive({ error: { message: "no se pudo" } });

    const { toast } = await import("sonner");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No se pudo cambiar de organización"),
    );
    expect(routerSpies.push).not.toHaveBeenCalled();
    expect(routerSpies.refresh).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId("organization-switcher-trigger")).toBeEnabled());
    expect(screen.getByTestId("organization-switcher-trigger")).toHaveTextContent(
      "Organización de Demo",
    );
  });
});
