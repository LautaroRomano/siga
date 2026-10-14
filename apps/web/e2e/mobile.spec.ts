import {
  acceptInvitationAsNewMember,
  expect,
  expectNoHorizontalPageScroll,
  inviteViaApi,
  newUser,
  signUpViaApi,
  test,
} from "./support/fixtures";

test.describe("Móvil", () => {
  test("el inicio abre con el menú hamburguesa y la tipografía es Google Sans, igual que en desktop", async ({
    authenticatedPage: page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Solo aplica al viewport de celular");
    await expect(page.getByRole("button", { name: "Toggle Sidebar" })).toBeVisible();
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily).toContain("Google Sans");
  });

  test("ninguna pantalla principal scrollea a lo ancho", async ({
    authenticatedPage: page,
    request,
  }) => {
    await inviteViaApi(
      request,
      `maria.fernanda.gonzalez.iturralde.${Date.now().toString(36)}@example.com`,
    );

    await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
    await expectNoHorizontalPageScroll(page);

    await page.goto("/configuracion");
    // La versión es lo último que renderiza la página: así se mide con todas las tarjetas
    // ya dibujadas.
    await expect(page.getByText("Invitación enviada")).toBeVisible();
    await expect(page.getByText(/^Versión .*\d+\.\d+$/)).toBeVisible();
    await expectNoHorizontalPageScroll(page);

    await page.getByRole("button", { name: "Invitar" }).click();
    await expect(page.getByRole("dialog", { name: "Invitar miembro" })).toBeVisible();
    await expectNoHorizontalPageScroll(page);
    await page.keyboard.press("Escape");

    await page.goto("/mi-perfil");
    await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
    await expectNoHorizontalPageScroll(page);
  });

  test("elegir una organización en el selector cierra el menú lateral", async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(!isMobile, "Solo aplica al menú lateral móvil");

    // El Administrador se autentica en `request` (vía API, sin tocar `page`): así `page` queda
    // libre para el registro del miembro, la cuenta que de verdad prueba el selector.
    const owner = newUser();
    await signUpViaApi(request, owner);
    const member = newUser();
    const invitation = await inviteViaApi(request, member.email);
    await acceptInvitationAsNewMember(page, invitation.id, member);

    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    const sidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]');
    await sidebar.getByTestId("organization-switcher-trigger").click();
    await page.getByRole("menuitemradio", { name: /Como miembro/ }).click();
    await expect(sidebar).toBeHidden();
  });
});
