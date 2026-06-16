import { test, expect } from "@playwright/test";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightCredentials,
  loginWithAdminCredentials,
} from "./helpers/auth";
import {
  SEED_DESCRIPTION_FILTER_CATEGORY,
  SEED_NAME_TAG_ATTACH_CATEGORY,
} from "./fixtures/seed-data";
import {
  expectDescriptionCategoryExists,
  expectDescriptionTagAttachedToCategory,
  expectDescriptionTagExists,
  expectNameCategoryExists,
  expectNameTagAttachedToCategory,
  expectNameTagExists,
  submitDescriptionCategoryForm,
  submitDescriptionTagForm,
  submitDescriptionTagFormWithCategories,
  submitNameCategoryForm,
  submitNameTagForm,
  submitNameTagFormWithCategories,
  uniqueE2ECategoryName,
  uniqueE2EDescriptionTag,
  uniqueE2ENameTag,
  waitForAdminSession,
} from "./helpers/admin-ui";

test.describe("Admin category and tag UI", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
    "PLAYWRIGHT_TEST and ADMIN credentials required",
  );

  test.beforeEach(async ({ page }) => {
    await loginWithAdminCredentials(page);
    await waitForAdminSession(page);
  });

  test("admin creates name category via form", async ({ page, request }) => {
    const category = uniqueE2ECategoryName("name-cat");

    await page.goto("/addnamecategory");
    await expect(
      page.getByRole("button", { name: "Submit name category" }),
    ).toBeVisible({ timeout: 15_000 });

    const status = await submitNameCategoryForm(page, category);
    expect(status).toBe(201);
    await expectNameCategoryExists(request, category);
  });

  test("admin creates description category via form", async ({
    page,
    request,
  }) => {
    const category = uniqueE2ECategoryName("desc-cat");

    await page.goto("/adddescriptioncategory");
    await expect(
      page.getByRole("button", { name: "Submit description category" }),
    ).toBeVisible({ timeout: 15_000 });

    const status = await submitDescriptionCategoryForm(page, category);
    expect(status).toBe(201);
    await expectDescriptionCategoryExists(request, category);
  });

  test("admin creates name tag via form", async ({ page, request }) => {
    const tag = uniqueE2ENameTag("name-tag");

    await page.goto("/addnametag");
    await expect(
      page.getByRole("button", { name: "Submit tag" }),
    ).toBeVisible({ timeout: 15_000 });

    const status = await submitNameTagForm(page, tag);
    expect(status).toBe(201);
    await expectNameTagExists(request, tag);
  });

  test("admin creates description tag via form", async ({ page, request }) => {
    const tag = uniqueE2EDescriptionTag("desc-tag");

    await page.goto("/adddescriptiontag");
    await expect(
      page.getByRole("button", { name: "Submit tag" }),
    ).toBeVisible({ timeout: 15_000 });

    const status = await submitDescriptionTagForm(page, tag);
    expect(status).toBe(201);
    await expectDescriptionTagExists(request, tag);
  });

  test("admin creates name tag and attaches to category via react-select", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);
    const tag = uniqueE2ENameTag("name-tag-attach");

    await page.goto("/addnametag");
    await expect(
      page.getByRole("button", { name: "Submit tag" }),
    ).toBeVisible({ timeout: 15_000 });

    const { postStatus, putStatus } = await submitNameTagFormWithCategories(
      page,
      tag,
      [SEED_NAME_TAG_ATTACH_CATEGORY],
    );
    expect(postStatus).toBe(201);
    expect(putStatus).toBe(200);

    await expectNameTagExists(request, tag);
    await expectNameTagAttachedToCategory(
      request,
      SEED_NAME_TAG_ATTACH_CATEGORY,
      tag,
    );
  });

  test("admin creates description tag and attaches to category via react-select", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);
    const tag = uniqueE2EDescriptionTag("desc-tag-attach");

    await page.goto("/adddescriptiontag");
    await expect(
      page.getByRole("button", { name: "Submit tag" }),
    ).toBeVisible({ timeout: 15_000 });

    const { postStatus, putStatus } =
      await submitDescriptionTagFormWithCategories(page, tag, [
        SEED_DESCRIPTION_FILTER_CATEGORY,
      ]);
    expect(postStatus).toBe(201);
    expect(putStatus).toBe(200);

    await expectDescriptionTagExists(request, tag);
    await expectDescriptionTagAttachedToCategory(
      request,
      SEED_DESCRIPTION_FILTER_CATEGORY,
      tag,
    );
  });
});
