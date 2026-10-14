import type { MemberDto, PendingInvitationDto } from "@repo/api/client";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MembersSection } from "@/components/settings/members-section";
import { RequestError } from "@/lib/api-client";
import { renderWithProviders } from "@/test/render";

const state = vi.hoisted(() => ({
  members: undefined as MemberDto[] | undefined,
  invitations: undefined as PendingInvitationDto[] | undefined,
}));

const mutations = vi.hoisted(() => ({
  invite: vi.fn(),
  resend: vi.fn(),
  cancel: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/hooks/use-members", () => ({
  useMembers: () => ({ data: state.members, isPending: state.members === undefined }),
  useRemoveMember: () => ({ mutateAsync: mutations.remove, isPending: false }),
}));

vi.mock("@/hooks/use-invitation", () => ({
  useInvitations: () => ({
    data: state.invitations,
    isPending: state.invitations === undefined,
  }),
  useInviteMember: () => ({ mutateAsync: mutations.invite, isPending: false }),
  useResendInvitation: () => ({ mutateAsync: mutations.resend, isPending: false }),
  useCancelInvitation: () => ({ mutateAsync: mutations.cancel, isPending: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const owner: MemberDto = {
  id: "m1",
  userId: "u1",
  name: "Ana Admin",
  email: "ana@example.com",
  role: "owner",
  createdAt: "2026-10-01T00:00:00.000Z",
};

const member: MemberDto = {
  id: "m2",
  userId: "u2",
  name: "Beto Miembro",
  email: "beto@example.com",
  role: "member",
  createdAt: "2026-10-02T00:00:00.000Z",
};

const invitation: PendingInvitationDto = {
  id: "inv-1",
  email: "carla@example.com",
  expiresAt: "2026-10-20T12:00:00.000Z",
  createdAt: "2026-10-13T12:00:00.000Z",
};

const render = () => renderWithProviders(<MembersSection currentUserId="u1" />);

const itemOf = (text: string) =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="item"]')].find((item) =>
    item.textContent?.includes(text),
  ) as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  state.members = [owner, member];
  state.invitations = [invitation];
  mutations.invite.mockResolvedValue(invitation);
  mutations.resend.mockResolvedValue(invitation);
  mutations.cancel.mockResolvedValue({ ok: true });
  mutations.remove.mockResolvedValue({ ok: true });
});

describe("MembersSection", () => {
  it("muestra esqueletos mientras cargan miembros o invitaciones", () => {
    state.invitations = undefined;
    render();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("Ana Admin")).not.toBeInTheDocument();
  });

  it("lista miembros con rol e invitaciones vigentes; el Administrador no tiene acciones", () => {
    render();
    const ownerItem = itemOf("Ana Admin");
    expect(within(ownerItem).getByText("Administrador")).toBeInTheDocument();
    expect(within(ownerItem).getByText("(vos)")).toBeInTheDocument();
    expect(within(ownerItem).queryByRole("button")).not.toBeInTheDocument();
    const memberItem = itemOf("Beto Miembro");
    expect(within(memberItem).getByText("Miembro")).toBeInTheDocument();
    expect(
      within(memberItem).getByRole("button", { name: "Acciones de Beto Miembro" }),
    ).toBeInTheDocument();
    const invitationItem = itemOf("carla@example.com");
    expect(within(invitationItem).getByText("Invitación enviada")).toBeInTheDocument();
    expect(within(invitationItem).getByText(/Vence el 20 oct 2026/)).toBeInTheDocument();
  });

  it("invita por email con validación y cierra el pop-up al enviar", async () => {
    render();
    await userEvent.click(screen.getByRole("button", { name: "Invitar" }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar miembro" });
    await userEvent.type(within(dialog).getByLabelText("Email"), "no-es-un-email");
    await userEvent.click(within(dialog).getByRole("button", { name: "Invitar" }));
    expect(await within(dialog).findByText("Email inválido")).toBeVisible();
    expect(mutations.invite).not.toHaveBeenCalled();

    await userEvent.clear(within(dialog).getByLabelText("Email"));
    await userEvent.type(within(dialog).getByLabelText("Email"), "Carla@Example.com");
    await userEvent.click(within(dialog).getByRole("button", { name: "Invitar" }));
    await waitFor(() =>
      expect(mutations.invite).toHaveBeenCalledWith({ email: "carla@example.com" }),
    );
    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Invitación enviada");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("un 409 de la API se muestra en el campo y el pop-up sigue abierto", async () => {
    mutations.invite.mockRejectedValueOnce(
      new RequestError(409, "CONFLICT", "Ya hay una invitación vigente para ese email"),
    );
    render();
    await userEvent.click(screen.getByRole("button", { name: "Invitar" }));
    const dialog = await screen.findByRole("dialog", { name: "Invitar miembro" });
    await userEvent.type(within(dialog).getByLabelText("Email"), "carla@example.com");
    await userEvent.click(within(dialog).getByRole("button", { name: "Invitar" }));
    const { toast } = await import("sonner");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Ya hay una invitación vigente para ese email"),
    );
    expect(screen.getByRole("dialog", { name: "Invitar miembro" })).toBeInTheDocument();
  });

  it("reenvía una invitación desde su menú", async () => {
    render();
    await userEvent.click(
      screen.getByRole("button", { name: "Acciones de la invitación a carla@example.com" }),
    );
    await userEvent.click(await screen.findByRole("menuitem", { name: "Reenviar invitación" }));
    await waitFor(() => expect(mutations.resend).toHaveBeenCalledWith("inv-1"));
    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Invitación reenviada");
  });

  it("cancelar una invitación pide confirmación: Volver no hace nada, confirmar cancela", async () => {
    render();
    await userEvent.click(
      screen.getByRole("button", { name: "Acciones de la invitación a carla@example.com" }),
    );
    await userEvent.click(await screen.findByRole("menuitem", { name: "Cancelar invitación" }));
    const alert = await screen.findByRole("alertdialog", {
      name: "¿Cancelar la invitación a carla@example.com?",
    });
    await userEvent.click(within(alert).getByRole("button", { name: "Volver" }));
    expect(mutations.cancel).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Acciones de la invitación a carla@example.com" }),
    );
    await userEvent.click(await screen.findByRole("menuitem", { name: "Cancelar invitación" }));
    const reopened = await screen.findByRole("alertdialog", {
      name: "¿Cancelar la invitación a carla@example.com?",
    });
    await userEvent.click(within(reopened).getByRole("button", { name: "Cancelar invitación" }));
    await waitFor(() => expect(mutations.cancel).toHaveBeenCalledWith("inv-1"));
  });

  it("quitar un miembro pide confirmación y llama a la API con su usuario", async () => {
    render();
    await userEvent.click(screen.getByRole("button", { name: "Acciones de Beto Miembro" }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Quitar de la organización" }),
    );
    const alert = await screen.findByRole("alertdialog", { name: "¿Quitar a Beto Miembro?" });
    await userEvent.click(within(alert).getByRole("button", { name: "Quitar" }));
    await waitFor(() => expect(mutations.remove).toHaveBeenCalledWith("u2"));
    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Miembro quitado");
  });
});
