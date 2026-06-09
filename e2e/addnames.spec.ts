import { test, expect } from "@playwright/test";
import { getPlaywrightCredentials, loginWithCredentials } from "./helpers/auth";
import {
  SEED_NAME,
  SEED_NAME_DUPLICATE_VARIANT,
} from "./fixtures/seed-data";

test.describe("Add names page", () => {
  test("logged-out visitor sees sign-in gate and disabled submit", async ({
    page,
  }) => {
    await page.goto("/addnames");

    await expect(
      page.getByText("To avoid spam, users must sign in to add names"),
    ).toBeVisible();
    await expect(page.getByText("please sign in to submit a name")).toBeVisible();
    await expect(page.locator("#nameInput")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Add name" })).toBeDisabled();
  });

  test("keeps submit disabled when logged out", async ({ page }) => {
    await page.goto("/addnames");
    await expect(page.getByRole("button", { name: "Add name" })).toBeDisabled();
  });
});

test.describe("Add names page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("shows client-side invalid character warning", async ({ page }) => {
    await page.goto("/addnames");
    await page.locator("#nameInput").fill("bad@name");

    await expect(
      page.getByText("@ is not a valid character", { exact: false }),
    ).toBeVisible();
  });

  test("submits a unique name", async ({ page }) => {
    const uniqueName = `E2E${Date.now().toString(36)}`;

    await page.goto("/addnames");
    await expect(page.locator("#nameInput")).toBeEnabled();

    await page.locator("#nameInput").fill(uniqueName);
    await page.getByRole("button", { name: "Add name" }).click();

    await expect(page.getByText("Successfully added name", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("rejects duplicate of seeded normalized name", async ({ page }) => {
    await page.goto("/addnames");
    await page.locator("#nameInput").fill(SEED_NAME_DUPLICATE_VARIANT);
    await page.getByRole("button", { name: "Add name" }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("seeded name detail page loads", async ({ page }) => {
    const response = await page.goto(`/name/${SEED_NAME}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(SEED_NAME, { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("rejects blocklisted exact name", async ({ page }) => {
    await page.goto("/addnames");
    await page.locator("#nameInput").fill("butt");
    await page.getByRole("button", { name: "Add name" }).click();

    await expect(page.getByText(/cannot be used by itself/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("allows blocklisted word when not alone (fluffy butt)", async ({
    page,
  }) => {
    const allowedName = `fluffy butt ${Date.now().toString(36)}`;

    await page.goto("/addnames");
    await page.locator("#nameInput").fill(allowedName);
    await page.getByRole("button", { name: "Add name" }).click();

    await expect(page.getByText("Successfully added name", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("created name detail page loads", async ({ page }) => {
    const uniqueName = `E2EPage${Date.now().toString(36)}`;

    await page.goto("/addnames");
    await page.locator("#nameInput").fill(uniqueName);
    await page.getByRole("button", { name: "Add name" }).click();
    await expect(page.getByText("Successfully added name", { exact: false })).toBeVisible({
      timeout: 15_000,
    });

    const response = await page.goto(`/name/${uniqueName}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(uniqueName, { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });
});
