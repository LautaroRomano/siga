import type { Page } from "@playwright/test";

import { expect, inviteViaApi, newUser, registerFromInvitation, test } from "./support/fixtures";

const membersCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ has: page.getByText("Miembros", { exact: true }) });

const memberItem = (page: Page, text: string) =>
  membersCard(page).locator('[data-slot="item"]').filter({ hasText: text });

const chooseInvitationAction = async (page: Page, email: string, action: string) => {
  await memberItem(page, email)
    .getByRole("button", { name: `Acciones de la invitación a ${email}` })
    .click();
  await page.getByRole("menuitem", { name: action }).click();
};

test.describe("Invitar a un miembro", () => {
  test("invitar desde Configuración, reenviar, registrarse desde el link, aceptar, quitar y cancelar", async ({
    authenticatedPage: page,
    request,
    user,
    browser,
  }) => {
    const invitee = newUser();
    await page.goto("/configuracion");
    await expect(memberItem(page, user.email).getByText("Administrador")).toBeVisible();

    await page.getByRole("button", { name: "Invitar" }).click();
    const dialog = page.getByRole("dialog", { name: "Invitar miembro" });
    await dialog.getByLabel("Email").fill("no-es-un-email");
    await dialog.getByRole("button", { name: "Invitar" }).click();
    await expect(dialog.getByText("Email inválido")).toBeVisible();
    await dialog.getByLabel("Email").fill(invitee.email);
    await dialog.getByRole("button", { name: "Invitar" }).click();
    await expect(page.getByText("Invitación enviada", { exact: true }).first()).toBeVisible();
    await expect(dialog).toBeHidden();
    const row = memberItem(page, invitee.email);
    await expect(row.getByText("Invitación enviada")).toBeVisible();

    const invitations = (await (await request.get("/api/v1/invitations")).json()) as {
      id: string;
      email: string;
    }[];
    const invitationId = invitations.find((item) => item.email === invitee.email)!.id;

    await chooseInvitationAction(page, invitee.email, "Reenviar invitación");
    await expect(page.getByText("Invitación reenviada")).toBeVisible();
    await expect(memberItem(page, invitee.email)).toHaveCount(1);

    const inviteePage = await (await browser.newContext()).newPage();
    await registerFromInvitation(inviteePage, invitationId, invitee);
    await expect(inviteePage.getByText(`Organización de ${user.name}`)).toBeVisible();
    await inviteePage.getByRole("button", { name: "Aceptar" }).click();
    await expect(inviteePage.getByText(`Te uniste a Organización de ${user.name}`)).toBeVisible();
    await expect(inviteePage).toHaveURL(/\/$/);
    await expect(inviteePage.getByRole("heading", { name: "Inicio" })).toBeVisible();
    await expect(inviteePage.getByText(invitee.email)).toBeVisible();

    await inviteePage.goto(`/invitacion/${invitationId}`);
    await expect(inviteePage.getByText("Esta invitación ya fue aceptada.")).toBeVisible();
    await expect(inviteePage.getByRole("button", { name: "Aceptar" })).toHaveCount(0);

    await page.reload();
    const memberRow = memberItem(page, invitee.email);
    await expect(memberRow.getByText("Miembro", { exact: true })).toBeVisible();
    await memberRow.getByRole("button", { name: `Acciones de ${invitee.name}` }).click();
    await page.getByRole("menuitem", { name: "Quitar de la organización" }).click();
    await page
      .getByRole("alertdialog", { name: `¿Quitar a ${invitee.name}?` })
      .getByRole("button", { name: "Quitar" })
      .click();
    await expect(page.getByText("Miembro quitado")).toBeVisible();
    await expect(memberItem(page, invitee.email)).toHaveCount(0);
    await inviteePage.goto("/");
    await expect(inviteePage.getByRole("heading", { name: "Inicio" })).toBeVisible();

    const reinvited = await inviteViaApi(request, invitee.email);
    expect(reinvited.id).not.toBe(invitationId);
    await page.reload();
    await chooseInvitationAction(page, invitee.email, "Cancelar invitación");
    const cancelDialog = page.getByRole("alertdialog", {
      name: `¿Cancelar la invitación a ${invitee.email}?`,
    });
    await expect(cancelDialog.getByText(/deja de servir/)).toBeVisible();
    await cancelDialog.getByRole("button", { name: "Volver" }).click();
    await expect(memberItem(page, invitee.email).getByText("Invitación enviada")).toBeVisible();

    await chooseInvitationAction(page, invitee.email, "Cancelar invitación");
    await page
      .getByRole("alertdialog", { name: `¿Cancelar la invitación a ${invitee.email}?` })
      .getByRole("button", { name: "Cancelar invitación" })
      .click();
    await expect(page.getByText("Invitación cancelada")).toBeVisible();
    await expect(memberItem(page, invitee.email)).toHaveCount(0);
    await inviteePage.goto(`/invitacion/${reinvited.id}`);
    await expect(
      inviteePage.getByText("Esta invitación fue cancelada por la organización."),
    ).toBeVisible();
    await expect(inviteePage.getByRole("button", { name: "Aceptar" })).toHaveCount(0);
    await expect(inviteePage.getByRole("button", { name: "Rechazar" })).toHaveCount(0);
  });

  test("con otro email la invitación explica y ofrece cerrar sesión; un link desconocido informa", async ({
    authenticatedPage: page,
    request,
  }) => {
    const invitation = await inviteViaApi(request, newUser().email);

    await page.goto("/invitacion/no-existe");
    await expect(page.getByText(/no existe o el link está incompleto/)).toBeVisible();

    await page.goto(`/invitacion/${invitation.id}`);
    await expect(page.getByText("Esta invitación es para otro email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aceptar" })).toHaveCount(0);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Finvitacion%2F${invitation.id}`));
  });

  test("rechazar la invitación la deja rechazada y no suma la organización", async ({
    authenticatedPage: _page,
    request,
    browser,
  }) => {
    const invitee = newUser();
    const invitation = await inviteViaApi(request, invitee.email);
    const inviteePage = await (await browser.newContext()).newPage();
    await registerFromInvitation(inviteePage, invitation.id, invitee);
    await inviteePage.getByRole("button", { name: "Rechazar" }).click();
    await expect(inviteePage.getByText("Invitación rechazada")).toBeVisible();
    await expect(inviteePage).toHaveURL(/\/$/);
    await expect(inviteePage.getByTestId("organization-switcher-trigger")).toHaveCount(0);
    await inviteePage.goto(`/invitacion/${invitation.id}`);
    await expect(inviteePage.getByText("Esta invitación ya fue rechazada.")).toBeVisible();
  });
});
