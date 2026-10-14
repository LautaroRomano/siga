import {
  acceptInvitationAsNewMember,
  apiRetries,
  expect,
  inviteViaApi,
  newUser,
  readMeViaApi,
  switchOrganization,
  test,
} from "./support/fixtures";

test.describe("Aviso de organización perdida", () => {
  test("quitar al miembro con la organización ajena activa avisa y lleva al inicio desde cualquier ruta", async ({
    authenticatedPage: page,
    request,
    browser,
  }) => {
    await expect(page.getByTestId("organization-switcher-trigger")).toHaveCount(0);

    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await acceptInvitationAsNewMember(memberPage, invitation.id, member);

    const me = await readMeViaApi(memberContext.request);
    const ownOrgName = me.organizations.find((organization) => organization.role === "owner")!.name;
    const otherOrgName = me.organizations.find(
      (organization) => organization.role === "member",
    )!.name;

    // Con la organización ajena activa, y en cualquier otra pantalla (no el inicio).
    await switchOrganization(memberPage, otherOrgName);
    await memberPage.goto("/mi-perfil");
    await expect(memberPage.getByRole("heading", { name: "Mi perfil" })).toBeVisible();

    const removed = await request.delete(`/api/v1/members/${me.userId}`, {
      maxRetries: apiRetries,
    });
    expect(removed.status()).toBe(200);

    // La próxima navegación (acá, recargar "Mi perfil") termina en el inicio con el aviso.
    await memberPage.reload();
    await expect(memberPage).toHaveURL(/\/$/);
    const lostOrganizationText = memberPage.getByText(`Ya no formás parte de ${otherOrgName}.`);
    await expect(lostOrganizationText).toBeVisible();
    await expect(memberPage.getByText(`Seguís viendo ${ownOrgName}.`)).toBeVisible();
    await expect(memberPage.getByTestId("organization-switcher-trigger")).toHaveCount(0);

    // Sin cerrarlo, sigue visible al navegar a otra pantalla (sin volver a atraparlo en el
    // inicio) y al volver a entrar.
    await memberPage.getByRole("link", { name: "Mi perfil", exact: true }).click();
    await expect(memberPage).toHaveURL(/\/mi-perfil/);
    await expect(lostOrganizationText).toBeVisible();
    await memberPage.reload();
    await expect(lostOrganizationText).toBeVisible();

    // Cerrado, no vuelve a aparecer.
    await memberPage.getByRole("button", { name: "Ocultar" }).click();
    await expect(lostOrganizationText).toHaveCount(0);
    await memberPage.reload();
    await expect(lostOrganizationText).toHaveCount(0);

    // La sesión sigue abierta con los datos propios.
    await expect(memberPage.getByRole("link", { name: "Configuración" })).toBeVisible();
  });

  test("quitar al miembro ya parado en el inicio no lo expulsa de la primera pantalla a la que navega después", async ({
    authenticatedPage: _page,
    request,
    browser,
  }) => {
    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await acceptInvitationAsNewMember(memberPage, invitation.id, member);

    const me = await readMeViaApi(memberContext.request);
    const otherOrgName = me.organizations.find(
      (organization) => organization.role === "member",
    )!.name;
    await switchOrganization(memberPage, otherOrgName);

    const removed = await request.delete(`/api/v1/members/${me.userId}`, {
      maxRetries: apiRetries,
    });
    expect(removed.status()).toBe(200);

    await memberPage.reload();
    await expect(memberPage).toHaveURL(/\/$/);
    const lostOrganizationText = memberPage.getByText(`Ya no formás parte de ${otherOrgName}.`);
    await expect(lostOrganizationText).toBeVisible();

    await memberPage.getByRole("link", { name: "Mi perfil", exact: true }).click();
    await expect(memberPage).toHaveURL(/\/mi-perfil/);
    await expect(lostOrganizationText).toBeVisible();
  });
});
