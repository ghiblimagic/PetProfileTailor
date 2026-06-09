import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithAdminCredentials,
  loginWithCredentials,
} from "./helpers/auth";

test.describe("Admin access", () => {
  test("regular user does not see Admin nav menu", async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: "Admin" })).not.toBeVisible();
  });

  test.describe("authenticated admin", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
      await loginWithAdminCredentials(page);
    });

    test("sees Admin nav menu with category links", async ({ page }) => {
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "Admin" }).click();
      await expect(page.getByRole("menuitem", { name: "Name tag" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Desc Tag" })).toBeVisible();
    });

    test("can create a name category via API", async ({ page }) => {
      const category = `E2E Category ${Date.now().toString(36)}`;
      const response = await page.request.post("/api/namecategories", {
        data: { category },
      });
      expect(response.status()).toBe(201);
    });
  });

  test("regular user cannot create name category via API", async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);

    const response = await page.request.post("/api/namecategories", {
      data: { category: `E2E Blocked ${Date.now().toString(36)}` },
    });
    expect(response.status()).toBe(403);
  });

  test("regular user cannot add tags to categories via API", async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);

    const response = await page.request.put("/api/namecategories/edittags", {
      data: {
        newtagid: "000000000000000000000000",
        categoriesToUpdate: ["000000000000000000000000"],
      },
    });
    expect(response.status()).toBe(403);
  });
});
