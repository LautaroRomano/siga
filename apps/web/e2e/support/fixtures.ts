import { expect, test as base, type APIRequestContext, type Page } from "@playwright/test";

export type User = { name: string; email: string; password: string };

const uniqueSuffix = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const newUser = (): User => {
  const suffix = uniqueSuffix();
  return {
    name: `Usuario E2E ${suffix}`,
    email: `e2e-${suffix}@example.com`,
    password: "e2e-password-1",
  };
};

export const apiRetries = 3;

export const signUpViaApi = async (request: APIRequestContext, user: User) => {
  const response = await request.post("/api/auth/sign-up/email", {
    data: user,
    maxRetries: apiRetries,
  });
  expect(response.ok()).toBeTruthy();
};

export type PendingInvitation = { id: string; email: string };

export const inviteViaApi = async (request: APIRequestContext, email: string) => {
  const response = await request.post("/api/v1/invitations", {
    data: { email },
    maxRetries: apiRetries,
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as PendingInvitation;
};

export type Me = {
  userId: string;
  organizationId: string;
  organizations: { id: string; name: string; slug: string; role: string }[];
};

export const readMeViaApi = async (request: APIRequestContext) => {
  const response = await request.get("/api/v1/me", { maxRetries: apiRetries });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Me;
};

const firstCompileTimeout = 60_000;

export const loginViaUi = async (page: Page, user: User) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: firstCompileTimeout });
};

// Registro desde el link de la invitación y aceptación: la cuenta nueva queda con su propia
// organización y como miembro de la que invitó.
export const registerFromInvitation = async (page: Page, invitationId: string, user: User) => {
  await page.goto(`/invitacion/${invitationId}`);
  await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Finvitacion%2F${invitationId}`));
  await page.getByRole("link", { name: "Registrate" }).click();
  await expect(page).toHaveURL(new RegExp(`/registro\\?next=%2Finvitacion%2F${invitationId}`));
  await page.getByLabel("Nombre y apellido").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(new RegExp(`/invitacion/${invitationId}`), {
    timeout: firstCompileTimeout,
  });
};

export const acceptInvitationAsNewMember = async (page: Page, invitationId: string, user: User) => {
  await registerFromInvitation(page, invitationId, user);
  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect(page).toHaveURL(/\/$/);
};

export const switchOrganization = async (page: Page, name: string | RegExp) => {
  await page.getByTestId("organization-switcher-trigger").click();
  await page.getByRole("menuitemradio", { name }).click();
  await expect(page).toHaveURL(/\/$/);
};

export const expectNoHorizontalPageScroll = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(0);
};

type Fixtures = {
  user: User;
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  user: async ({ request }, use) => {
    const user = newUser();
    await signUpViaApi(request, user);
    await use(user);
  },
  authenticatedPage: async ({ page, user }, use) => {
    await loginViaUi(page, user);
    await use(page);
  },
});

export { expect };
