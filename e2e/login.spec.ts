import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";
import { getPlaywrightBannedCredentials } from "./fixtures/seed-data";
import {
  expectSignInRedirectParam,
  postEmailSignIn,
} from "./helpers/magic-link";

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

  test("rejects banned account credentials", async ({ page }) => {
    const creds = getPlaywrightBannedCredentials();
    test.skip(!creds, "Banned user not configured (run pnpm seed:e2e)");

    await page.goto("/login");
    await page.locator("#email").fill(creds!.email);
    await page.locator("#password").fill(creds!.password);
    await page.getByRole("button", { name: "sign in", exact: true }).click();

    await expect(
      page.getByText(/this account has been banned/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows ban toast when redirected with ?error=Banned", async ({ page }) => {
    await page.goto("/login?error=Banned");

    await expect(
      page.getByRole("alert").filter({ hasText: /this account has been banned/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows user not found toast when redirected with ?error=UserNotFound", async ({
    page,
  }) => {
    await page.goto("/login?error=UserNotFound");

    await expect(
      page.getByRole("alert").filter({ hasText: /user not found/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows database unavailable toast when redirected with ?error=DBUnavailable", async ({
    page,
  }) => {
    await page.goto("/login?error=DBUnavailable");

    await expect(
      page.getByRole("alert").filter({ hasText: /database unavailable/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("magic link sign-in for banned email redirects with ?error=Banned", async ({
    request,
  }) => {
    const creds = getPlaywrightBannedCredentials();
    test.skip(!creds, "Banned user not configured (run pnpm seed:e2e)");

    const result = await postEmailSignIn(request, creds!.email);
    expect(result.status).toBe(200);
    expectSignInRedirectParam(result.url, "Banned");
  });
});
