import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
  openProfileMenu,
  restorePlaywrightTestUserStatus,
  setE2eUserStatus,
  signOutViaNav,
} from "./helpers/auth";
import { getPlaywrightProfileName } from "./helpers/register";

test.describe("Auth & session", () => {
  test("logged-out visitor is redirected from /dashboard to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test.describe("authenticated", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
      await loginWithCredentials(page);
    });

    test("dashboard loads for logged-in user", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByText(/Welcome Back/i)).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByText("Select which content you wish to view"),
      ).toBeVisible();
    });

    test("notifications page loads", async ({ page }) => {
      const response = await page.goto("/notifications");
      expect(response?.status()).toBeLessThan(500);
      await expect(page.getByText("Notifications", { exact: true })).toBeVisible({
        timeout: 15_000,
      });
    });

    test("profile page loads for seeded test user", async ({ page }) => {
      const profileName = getPlaywrightProfileName();
      const response = await page.goto(`/profile/${profileName}`);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.getByText("User not found")).not.toBeVisible();
      await expect(page.locator("body")).not.toBeEmpty();
    });

    test("profile menu shows Profile link", async ({ page }) => {
      await page.goto("/dashboard");
      await openProfileMenu(page);
      await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible();
    });

    test("sign out returns to login and credentials login restores session", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await signOutViaNav(page);
      await expect(page.getByRole("heading", { name: /login with a magic link/i })).toBeVisible();

      await loginWithCredentials(page);
      await expect(page.getByText("Open profile menu")).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("mid-session ban", () => {
    test.describe.configure({ mode: "serial" });

    test.afterEach(async ({ page }) => {
      await restorePlaywrightTestUserStatus(page);
    });

    test("ban while logged in then refresh signs user out", async ({ page }) => {
      test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

      await loginWithCredentials(page);
      await page.goto("/dashboard");
      await expect(page.getByText(/Welcome Back/i)).toBeVisible({
        timeout: 15_000,
      });

      await setE2eUserStatus(page, "banned");

      const sessionResponse = await page.request.get("/api/auth/session");
      const sessionJson = await sessionResponse.json();
      expect(sessionJson).toBeNull();

      await page.reload();

      await expect(page.getByText("Open profile menu")).not.toBeVisible({
        timeout: 15_000,
      });
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    });
  });
});
