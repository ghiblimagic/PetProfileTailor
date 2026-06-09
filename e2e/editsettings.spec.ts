import { test, expect } from "@playwright/test";
import { getPlaywrightCredentials, loginWithCredentials } from "./helpers/auth";

test.describe("Edit settings page", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("shows validation error when name is cleared", async ({ page }) => {
    await page.goto("/editsettings");
    await expect(
      page.getByRole("heading", { name: "Update Profile" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("#name").clear();
    await page.getByRole("button", { name: "Update Profile" }).click();

    await expect(page.getByText("Please enter a name")).toBeVisible({
      timeout: 10_000,
    });
  });
});
