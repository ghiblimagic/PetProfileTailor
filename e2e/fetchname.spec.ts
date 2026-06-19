import { test, expect } from "@playwright/test";
import { SEED_NAME, SEED_NAME_WITH_PUNCTUATION } from "./fixtures/seed-data";
import { gotoFetchNamePage, searchFetchName } from "./helpers/fetchname-ui";

test.describe("/fetchname single name search", () => {
  test("loads public page with search input", async ({ page }) => {
    await gotoFetchNamePage(page);
    await expect(
      page.getByText(/Check if a name exists:/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Search" }),
    ).toBeVisible();
  });

  test("finds duplicate for seeded name", async ({ page }) => {
    await gotoFetchNamePage(page);
    await searchFetchName(page, SEED_NAME);

    await expect(page.getByText(/already exists/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator("span.font-bold.text-center").filter({ hasText: SEED_NAME }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("finds duplicate for punctuation variant of seeded name", async ({
    page,
  }) => {
    await gotoFetchNamePage(page);
    await searchFetchName(page, SEED_NAME_WITH_PUNCTUATION);

    await expect(page.getByText(/already exists/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("reports success when name is not in database", async ({ page }) => {
    const uniqueName = `E2E fetchname ${Date.now().toString(36)}`;

    await gotoFetchNamePage(page);
    await searchFetchName(page, uniqueName);

    await expect(
      page.getByText(/Success! That content is not in the database/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("shows invalid character warning and disables search", async ({
    page,
  }) => {
    await gotoFetchNamePage(page);
    await page.locator("#checkExists").fill("bad@name");

    await expect(
      page.getByText(/@ is not a valid character/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Search" }),
    ).toBeDisabled();
  });
});
