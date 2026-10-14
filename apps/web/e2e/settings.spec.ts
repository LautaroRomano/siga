import { expect, test } from "./support/fixtures";

test.describe("Configuración", () => {
  test("muestra la versión del sistema y sus novedades, aunque no haya cambios", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/configuracion");
    await expect(page.getByText(/^Versión .*\d+\.\d+$/)).toBeVisible();
    await page.getByRole("button", { name: "Novedades" }).click();
    const dialog = page.getByRole("dialog", { name: "Novedades" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 3 })).toBeVisible();
    await expect(
      dialog.getByRole("listitem").or(dialog.getByText("Sin cambios registrados.")).first(),
    ).toBeVisible();
  });

  test("lista al Administrador como único miembro y ofrece invitar", async ({
    authenticatedPage: page,
    user,
  }) => {
    await page.goto("/configuracion");
    const membersCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Miembros", { exact: true }) });
    const items = membersCard.locator('[data-slot="item"]');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText(user.name);
    await expect(items.first()).toContainText("Administrador");
    await expect(items.first().getByRole("button", { name: /Acciones de/ })).toHaveCount(0);
    await expect(membersCard.getByRole("button", { name: "Invitar" })).toBeVisible();
  });
});
