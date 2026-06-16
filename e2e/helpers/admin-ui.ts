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

export async function selectStyledSelectOptions(
  page: Page,
  inputId: string,
  optionLabels: string[],
): Promise<void> {
  const input = page.locator(`#${inputId}`);
  await expect(input).toBeVisible({ timeout: 15_000 });

  for (const label of optionLabels) {
    await input.click();
    await input.fill(label);
    const option = page.getByRole("option", { name: label, exact: true });
    await expect(option).toBeVisible({ timeout: 15_000 });
    await option.click();
  }
}

export async function createNameCategoryViaApi(
  page: Page,
  category: string,
): Promise<void> {
  const response = await page.request.post("/api/namecategories", {
    data: { category },
  });
  expect(response.status()).toBe(201);
}

export async function createDescriptionCategoryViaApi(
  page: Page,
  category: string,
): Promise<void> {
  const response = await page.request.post("/api/descriptioncategory", {
    data: { category },
  });
  expect(response.status()).toBe(201);
}

export async function submitNameTagFormWithCategories(
  page: Page,
  tag: string,
  categoryLabels: string[],
): Promise<{ postStatus: number; putStatus: number | null }> {
  await page.locator("#categoryInput").fill(tag);
  if (categoryLabels.length > 0) {
    await selectStyledSelectOptions(page, "categoryTags", categoryLabels);
  }

  const postPromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nametag") &&
      response.request().method() === "POST",
  );
  const putPromise =
    categoryLabels.length > 0
      ? page.waitForResponse(
          (response) =>
            response.url().includes("/api/namecategories/edittags") &&
            response.request().method() === "PUT",
        )
      : null;

  await page.getByRole("button", { name: "Submit tag" }).click();
  const postResponse = await postPromise;
  const putResponse = putPromise ? await putPromise : null;
  return {
    postStatus: postResponse.status(),
    putStatus: putResponse?.status() ?? null,
  };
}

export async function submitDescriptionTagFormWithCategories(
  page: Page,
  tag: string,
  categoryLabels: string[],
): Promise<{ postStatus: number; putStatus: number | null }> {
  await page.locator("#categoryInput").fill(tag);
  if (categoryLabels.length > 0) {
    await selectStyledSelectOptions(page, "descriptionTags", categoryLabels);
  }

  const postPromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/descriptiontag") &&
      response.request().method() === "POST",
  );
  const putPromise =
    categoryLabels.length > 0
      ? page.waitForResponse(
          (response) =>
            response.url().includes("/api/descriptioncategory/edittags") &&
            response.request().method() === "PUT",
        )
      : null;

  await page.getByRole("button", { name: "Submit tag" }).click();
  const postResponse = await postPromise;
  const putResponse = putPromise ? await putPromise : null;
  return {
    postStatus: postResponse.status(),
    putStatus: putResponse?.status() ?? null,
  };
}

export async function expectNameTagAttachedToCategory(
  request: APIRequestContext,
  categoryName: string,
  tagName: string,
): Promise<void> {
  const response = await request.get("/api/namecategories");
  expect(response.ok()).toBeTruthy();
  const categories = (await response.json()) as Array<{
    category?: string;
    tags?: Array<{ tag?: string } | string>;
  }>;
  const category = categories.find((entry) => entry.category === categoryName);
  expect(category).toBeTruthy();
  const tags = category?.tags ?? [];
  expect(
    tags.some((entry) =>
      typeof entry === "object" && entry !== null
        ? entry.tag === tagName
        : false,
    ),
  ).toBeTruthy();
}

export async function expectDescriptionTagAttachedToCategory(
  request: APIRequestContext,
  categoryName: string,
  tagName: string,
): Promise<void> {
  const response = await request.get("/api/descriptioncategory");
  expect(response.ok()).toBeTruthy();
  const categories = (await response.json()) as Array<{
    category?: string;
    tags?: Array<{ tag?: string } | string>;
  }>;
  const category = categories.find((entry) => entry.category === categoryName);
  expect(category).toBeTruthy();
  const tags = category?.tags ?? [];
  expect(
    tags.some((entry) =>
      typeof entry === "object" && entry !== null
        ? entry.tag === tagName
        : false,
    ),
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
