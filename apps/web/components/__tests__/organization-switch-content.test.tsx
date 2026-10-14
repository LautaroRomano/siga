import { SidebarProvider } from "@repo/ui/components/sidebar";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationSwitchContent } from "@/components/layout/organization-switch-content";
import {
  OrganizationSwitchProvider,
  useOrganizationSwitch,
} from "@/components/layout/organization-switch-provider";
import { renderWithProviders } from "@/test/render";

const setActive = vi.hoisted(() => vi.fn());
const routerSpies = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("@repo/auth/client", () => ({
  authClient: { organization: { setActive } },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerSpies,
}));

// Dispara el cambio desde afuera del wrapper, como hace el selector de la barra: comparten el
// mismo `useOrganizationSwitch`.
function SwitchTrigger() {
  const { switchOrganization } = useOrganizationSwitch();
  return <button onClick={() => switchOrganization("org-otra")}>Cambiar</button>;
}

const skeletons = () => document.querySelectorAll('[data-slot="skeleton"]');

const pendingSetActive = () => {
  let resolve!: (value: { error?: unknown }) => void;
  const promise = new Promise<{ error?: unknown }>((res) => {
    resolve = res;
  });
  setActive.mockReturnValueOnce(promise);
  return resolve;
};

beforeEach(() => {
  setActive.mockReset();
  routerSpies.push.mockClear();
  routerSpies.refresh.mockClear();
});

describe("OrganizationSwitchContent", () => {
  it("sin cambio en curso muestra el contenido de la pantalla, sin esqueleto", () => {
    renderWithProviders(
      <SidebarProvider>
        <OrganizationSwitchProvider>
          <OrganizationSwitchContent>
            <div>Contenido de la pantalla</div>
          </OrganizationSwitchContent>
        </OrganizationSwitchProvider>
      </SidebarProvider>,
    );
    expect(screen.getByText("Contenido de la pantalla")).toBeInTheDocument();
    expect(skeletons().length).toBe(0);
  });

  it("mientras cambia de organización reemplaza cualquier pantalla por un esqueleto, hasta que termina", async () => {
    const resolveSetActive = pendingSetActive();
    renderWithProviders(
      <SidebarProvider>
        <OrganizationSwitchProvider>
          <SwitchTrigger />
          <OrganizationSwitchContent>
            <div>Datos de la organización anterior</div>
          </OrganizationSwitchContent>
        </OrganizationSwitchProvider>
      </SidebarProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(setActive).toHaveBeenCalledWith({ organizationId: "org-otra" });

    await waitFor(() => {
      expect(screen.queryByText("Datos de la organización anterior")).not.toBeInTheDocument();
      expect(skeletons().length).toBeGreaterThan(0);
    });
    expect(routerSpies.refresh).not.toHaveBeenCalled();

    resolveSetActive({});
    await waitFor(() =>
      expect(screen.getByText("Datos de la organización anterior")).toBeInTheDocument(),
    );
    expect(skeletons().length).toBe(0);
  });
});
