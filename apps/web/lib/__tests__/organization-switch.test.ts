import { describe, expect, it, vi } from "vitest";

import { resetForNewOrganization } from "@/lib/organization-switch";

describe("organization-switch", () => {
  it("limpia React Query, va al inicio y refresca el layout", () => {
    const queryClient = { clear: vi.fn() };
    const router = { push: vi.fn(), refresh: vi.fn() };

    resetForNewOrganization(queryClient, router);

    expect(queryClient.clear).toHaveBeenCalledOnce();
    expect(router.push).toHaveBeenCalledWith("/");
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("con un destino explícito, va ahí en vez de al inicio", () => {
    const router = { push: vi.fn(), refresh: vi.fn() };
    resetForNewOrganization({ clear: vi.fn() }, router, "/mi-perfil");
    expect(router.push).toHaveBeenCalledWith("/mi-perfil");
  });
});
