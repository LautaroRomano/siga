import type { Locator, Page } from "@playwright/test";

import {
  acceptInvitationAsNewMember,
  expect,
  inviteViaApi,
  loginViaUi,
  newUser,
  test,
} from "./support/fixtures";

test.describe("Selector de organización", () => {
  test("solo aparece con más de una organización; elegir la ajena activa la sesión en ella y vuelve a la propia al reingresar", async ({
    authenticatedPage: page,
    request,
    browser,
  }) => {
    await expect(page.getByTestId("organization-switcher-trigger")).toHaveCount(0);

    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);
    const memberPage = await (await browser.newContext()).newPage();
    await acceptInvitationAsNewMember(memberPage, invitation.id, member);

    const trigger = memberPage.getByTestId("organization-switcher-trigger");
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText("Tu organización");

    await trigger.click();
    const items = memberPage.getByRole("menu").getByRole("menuitemradio");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("Tu organización");
    await expect(items.nth(0)).toBeChecked();
    await expect(items.nth(1)).toContainText("Como miembro");
    await expect(items.nth(1)).not.toBeChecked();

    await items.nth(1).click();
    await expect(memberPage).toHaveURL(/\/$/);
    await expect(trigger).toContainText("Como miembro");

    await memberPage.getByTestId("user-menu-trigger").click();
    await memberPage.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(memberPage).toHaveURL(/\/login/);
    await loginViaUi(memberPage, member);
    await expect(trigger).toContainText("Tu organización");
  });

  test("renombrar la organización valida, persiste y lo ve el miembro", async ({
    authenticatedPage: page,
    request,
    browser,
  }) => {
    await page.goto("/configuracion");
    const organizationCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Organización", { exact: true }) });
    const nameInput = organizationCard.getByLabel("Nombre de la organización");
    await expect(nameInput).not.toHaveValue("");

    await nameInput.fill("   ");
    await organizationCard.getByRole("button", { name: "Guardar" }).click();
    await expect(organizationCard.getByText("Ingresá un nombre")).toBeVisible();

    await nameInput.fill("  Organización QA Norte  ");
    await organizationCard.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Organización actualizada")).toBeVisible();
    await page.reload();
    await expect(organizationCard.getByLabel("Nombre de la organización")).toHaveValue(
      "Organización QA Norte",
    );

    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);
    const memberPage = await (await browser.newContext()).newPage();
    await acceptInvitationAsNewMember(memberPage, invitation.id, member);

    await memberPage.getByTestId("organization-switcher-trigger").click();
    await memberPage.getByRole("menuitemradio", { name: /Organización QA Norte/ }).click();
    await expect(memberPage).toHaveURL(/\/$/);
    await expect(memberPage.getByTestId("organization-switcher-trigger")).toContainText(
      "Organización QA Norte",
    );
  });

  // Un cambio con la respuesta retenida, en un sentido, con las aserciones de carga.
  const assertLoadingSwitch = async (
    memberPage: Page,
    trigger: Locator,
    itemName: string,
    expectedLegend: string,
  ) => {
    let releaseSetActive = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseSetActive = resolve;
    });
    await memberPage.route("**/api/auth/organization/set-active", async (route) => {
      await gate;
      await route.continue();
    });

    await trigger.click();
    await memberPage.getByRole("menuitemradio", { name: itemName }).click();

    await expect(trigger).toBeDisabled();
    // El menú no deja navegar mientras carga: los ítems de siempre no están, un esqueleto
    // ocupa su lugar.
    await expect(memberPage.getByRole("link", { name: "Mi perfil" })).not.toBeVisible();

    releaseSetActive();
    await expect(trigger).toContainText(expectedLegend);
    await expect(trigger).toBeEnabled();
    await expect(memberPage.getByRole("link", { name: "Mi perfil" })).toBeVisible();
    await memberPage.unroute("**/api/auth/organization/set-active");
  };

  test("muestra carga ya, sin nada de la anterior, en ambos sentidos y al repetir el cambio", async ({
    authenticatedPage: page,
    request,
    browser,
  }) => {
    await expect(page.getByTestId("organization-switcher-trigger")).toHaveCount(0);

    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);
    const memberPage = await (await browser.newContext()).newPage();
    await acceptInvitationAsNewMember(memberPage, invitation.id, member);

    const trigger = memberPage.getByTestId("organization-switcher-trigger");
    await expect(trigger).toContainText("Tu organización");

    await assertLoadingSwitch(memberPage, trigger, "Como miembro", "Como miembro");
    await assertLoadingSwitch(memberPage, trigger, "Tu organización", "Tu organización");
  });

  test("si falla, avisa y sigue activa la organización actual, sin trabarse", async ({
    authenticatedPage: page,
    request,
    browser,
  }) => {
    await expect(page.getByTestId("organization-switcher-trigger")).toHaveCount(0);

    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);
    const memberPage = await (await browser.newContext()).newPage();
    await acceptInvitationAsNewMember(memberPage, invitation.id, member);

    const trigger = memberPage.getByTestId("organization-switcher-trigger");
    await expect(trigger).toContainText("Tu organización");

    await memberPage.route("**/api/auth/organization/set-active", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );

    await trigger.click();
    await memberPage.getByRole("menuitemradio", { name: "Como miembro" }).click();

    await expect(memberPage.getByText("No se pudo cambiar de organización")).toBeVisible();
    await expect(trigger).toContainText("Tu organización");
    await expect(trigger).toBeEnabled();
    await expect(memberPage.getByRole("link", { name: "Mi perfil" })).toBeVisible();
  });
});
