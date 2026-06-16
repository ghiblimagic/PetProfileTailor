import { expect, type APIRequestContext, type Page } from "@playwright/test";

export function uniqueE2ECategoryName(prefix: string): string {
  return `e2e-${prefix}-${Date.now().toString(36)}`;
}

/** Wait until NextAuth session exposes admin role (client gates admin forms). */
export async function waitForAdminSession(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const response = await page.request.get("/api/auth/session");
      if (!response.ok()) return false;
      const session = (await response.json()) as {
        user?: { role?: string; status?: string };
      };
      return (
        session.user?.role === "admin" && session.user?.status === "active"
      );
    })
    .toBe(true);
}

export async function submitNameCategoryForm(
  page: Page,
  category: string,
): Promise<number> {
  await page.locator("#categoryInput").fill(category);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/namecategories") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Submit name category" }).click();
  const response = await responsePromise;
  return response.status();
}

export async function submitDescriptionCategoryForm(
  page: Page,
  category: string,
): Promise<number> {
  await page.locator("#categoryInput").fill(category);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/descriptioncategory") &&
      response.request().method() === "POST",
  );

  await page
    .getByRole("button", { name: "Submit description category" })
    .click();
  const response = await responsePromise;
  return response.status();
}

export async function expectNameCategoryExists(
  request: APIRequestContext,
  category: string,
): Promise<void> {
  const response = await request.get("/api/namecategories");
  expect(response.ok()).toBeTruthy();
  const categories = (await response.json()) as Array<{ category?: string }>;
  expect(
    categories.some((entry) => entry.category === category),
  ).toBeTruthy();
}

export async function expectDescriptionCategoryExists(
  request: APIRequestContext,
  category: string,
): Promise<void> {
  const response = await request.get("/api/descriptioncategory");
  expect(response.ok()).toBeTruthy();
  const categories = (await response.json()) as Array<{ category?: string }>;
  expect(
    categories.some((entry) => entry.category === category),
  ).toBeTruthy();
}
