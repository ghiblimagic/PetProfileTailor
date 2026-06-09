import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";

test.describe("Login page", () => {
  test("shows magic link section and register link", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /login with a magic link/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" }).first()).toBeVisible();
    await expect(page.getByText("Sign in without a password!")).toBeVisible();
  });

  test("rejects wrong password", async ({ page }) => {
    const creds = getPlaywrightCredentials();
    test.skip(!creds, "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

    await page.goto("/login");
    await page.locator("#email").fill(creds!.email);
    await page.locator("#password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "sign in", exact: true }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test("credentials login shows logged-in nav", async ({ page }) => {
    const creds = getPlaywrightCredentials();
    test.skip(!creds, "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

    await loginWithCredentials(page);

    await expect(page.getByText("Open profile menu")).toBeVisible({
      timeout: 10_000,
    });
  });
});
