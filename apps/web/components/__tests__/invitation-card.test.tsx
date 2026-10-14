import type { InvitationDto } from "@repo/api/client";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationCard } from "@/components/invitations/invitation-card";
import { RequestError } from "@/lib/api-client";
import { renderWithProviders } from "@/test/render";

const { pushMock, refreshMock, signOut, acceptMutateAsync, rejectMutateAsync, state } = vi.hoisted(
  () => ({
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    signOut: vi.fn(),
    acceptMutateAsync: vi.fn(),
    rejectMutateAsync: vi.fn(),
    state: {
      invitation: undefined as InvitationDto | undefined,
      error: undefined as Error | undefined,
      pending: false,
    },
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@repo/auth/client", () => ({ authClient: { signOut } }));

vi.mock("@/hooks/use-invitation", () => ({
  useInvitation: () => ({
    data: state.invitation,
    error: state.error,
    isPending: state.pending,
    isError: Boolean(state.error),
  }),
  useAcceptInvitation: () => ({ mutateAsync: acceptMutateAsync, isPending: false }),
  useRejectInvitation: () => ({ mutateAsync: rejectMutateAsync, isPending: false }),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const invitation = (overrides: Partial<InvitationDto> = {}): InvitationDto => ({
  id: "inv-1",
  organizationName: "Organización de Ana Demo",
  status: "PENDING",
  expiresAt: "2026-09-22T12:00:00.000Z",
  forCurrentUser: true,
  ...overrides,
});

const render = () => renderWithProviders(<InvitationCard id="inv-1" userEmail="yo@x.com" />);

beforeEach(() => {
  vi.clearAllMocks();
  state.invitation = undefined;
  state.error = undefined;
  state.pending = false;
  signOut.mockResolvedValue(undefined);
});

describe("InvitationCard", () => {
  it("muestra skeletons mientras carga", () => {
    state.pending = true;
    render();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("con la invitación vigente muestra la organización y acepta volviendo al inicio", async () => {
    state.invitation = invitation();
    acceptMutateAsync.mockResolvedValue({ organizationName: "Organización de Ana Demo" });
    render();
    expect(screen.getByText("Organización de Ana Demo")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    await waitFor(() => expect(acceptMutateAsync).toHaveBeenCalledWith("inv-1"));
    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Te uniste a Organización de Ana Demo");
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("rechazar llama a la API y vuelve al inicio", async () => {
    state.invitation = invitation();
    rejectMutateAsync.mockResolvedValue({ organizationName: "Organización de Ana Demo" });
    render();
    await userEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    await waitFor(() => expect(rejectMutateAsync).toHaveBeenCalledWith("inv-1"));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("si la API rechaza la aceptación, avisa y se queda", async () => {
    state.invitation = invitation();
    acceptMutateAsync.mockRejectedValue(new RequestError(403, "FORBIDDEN", "Es para otro email"));
    render();
    await userEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    const { toast } = await import("sonner");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Es para otro email"));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("con otro email explica, no deja aceptar y ofrece cerrar sesión volviendo al link", async () => {
    state.invitation = invitation({ forCurrentUser: false });
    render();
    expect(screen.getByText("Esta invitación es para otro email")).toBeVisible();
    expect(screen.getByText(/Estás con yo@x.com/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Aceptar" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(pushMock).toHaveBeenCalledWith("/login?next=%2Finvitacion%2Finv-1");
  });

  it("cerrar sesión desde la invitación limpia la caché igual que el menú de usuario", async () => {
    state.invitation = invitation({ forCurrentUser: false });
    const { queryClient } = render();
    const clear = vi.spyOn(queryClient, "clear");
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(clear).toHaveBeenCalledOnce();
  });

  it.each([
    ["EXPIRED", /venció/],
    ["CANCELED", /fue cancelada/],
    ["ACCEPTED", /ya fue aceptada/],
    ["REJECTED", /ya fue rechazada/],
  ] as const)("con estado %s informa el motivo sin botones de respuesta", (status, message) => {
    state.invitation = invitation({ status });
    render();
    expect(screen.getByText("Invitación no disponible")).toBeVisible();
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Aceptar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Rechazar" })).toBeNull();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
  });

  it("con un link desconocido lo dice", () => {
    state.error = new RequestError(404, "NOT_FOUND", "Invitación no encontrada");
    render();
    expect(screen.getByText(/no existe o el link está incompleto/)).toBeVisible();
  });
});
