import { expect, test } from "./support/fixtures";

test.describe("Página no encontrada", () => {
  test("una URL cualquiera inexistente muestra la pantalla neutra, nunca el 404 de Next en inglés", async ({
    page,
  }) => {
    const response = await page.goto("/pagina-que-no-existe-404");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("No encontramos esa página")).toBeVisible();
    await expect(page.getByText("Revisá que el link esté completo.")).toBeVisible();
    await expect(page.getByText("This page could not be found.")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /iniciar sesión|ingresar/i })).toHaveCount(0);
  });

  test("con sesión, una URL inexistente también muestra la pantalla neutra", async ({
    authenticatedPage: page,
  }) => {
    const response = await page.goto("/mi-perfil/algo-que-no-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("No encontramos esa página")).toBeVisible();
  });
});
