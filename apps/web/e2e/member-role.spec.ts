import {
  acceptInvitationAsNewMember,
  expect,
  inviteViaApi,
  newUser,
  readMeViaApi,
  switchOrganization,
  test,
} from "./support/fixtures";

test.describe("Rol de miembro", () => {
  test("el miembro no ve Configuración de la organización ajena ni por URL, y vuelve a verla en la propia", async ({
    authenticatedPage: page,
    request,
    browser,
  }) => {
    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);

    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await acceptInvitationAsNewMember(memberPage, invitation.id, member);
    await expect(memberPage.getByRole("link", { name: "Configuración" })).toBeVisible();

    const me = await readMeViaApi(memberContext.request);
    const foreign = me.organizations.find((organization) => organization.role === "member")!;
    await switchOrganization(memberPage, foreign.name);
    await expect(memberPage.getByRole("link", { name: "Configuración" })).toHaveCount(0);
    await expect(memberPage.getByRole("link", { name: "Mi perfil" })).toBeVisible();
    await memberPage.goto("/configuracion");
    await expect(memberPage).toHaveURL(/\/$/);
    await expect(memberPage.getByRole("heading", { name: "Configuración" })).toHaveCount(0);

    const forbidden = await memberContext.request.patch("/api/v1/settings", {
      data: { name: "Otro" },
    });
    expect(forbidden.status()).toBe(403);

    await page.goto("/configuracion");
    await expect(
      page.locator('[data-slot="item"]').filter({ hasText: member.email }).getByText("Miembro", {
        exact: true,
      }),
    ).toBeVisible();

    await switchOrganization(memberPage, /Tu organización/);
    await expect(memberPage.getByRole("link", { name: "Configuración" })).toBeVisible();
  });
});
