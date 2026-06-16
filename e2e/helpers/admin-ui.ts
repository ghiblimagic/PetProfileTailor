import { expect, type APIRequestContext, type Page } from "@playwright/test";

export function uniqueE2ECategoryName(prefix: string): string {
  return `e2e-${prefix}-${Date.now().toString(36)}`;
}

export function uniqueE2ENameTag(prefix: string): string {
  return `e2e-${prefix}-${Date.now().toString(36)}`;
}

export function uniqueE2EDescriptionTag(prefix: string): string {
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

export async function submitNameTagForm(
  page: Page,
  tag: string,
): Promise<number> {
  await page.locator("#categoryInput").fill(tag);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nametag") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Submit tag" }).click();
  const response = await responsePromise;
  return response.status();
}

export async function expectNameTagExists(
  request: APIRequestContext,
  tag: string,
): Promise<void> {
  const response = await request.get("/api/nametag");
  expect(response.ok()).toBeTruthy();
  const tags = (await response.json()) as Array<{ tag?: string }>;
  expect(tags.some((entry) => entry.tag === tag)).toBeTruthy();
}

export async function submitDescriptionTagForm(
  page: Page,
  tag: string,
): Promise<number> {
  await page.locator("#categoryInput").fill(tag);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/descriptiontag") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Submit tag" }).click();
  const response = await responsePromise;
  return response.status();
}

export async function expectDescriptionTagExists(
  request: APIRequestContext,
  tag: string,
): Promise<void> {
  const response = await request.get("/api/descriptiontag");
  expect(response.ok()).toBeTruthy();
  const tags = (await response.json()) as Array<{ tag?: string }>;
  expect(tags.some((entry) => entry.tag === tag)).toBeTruthy();
}
