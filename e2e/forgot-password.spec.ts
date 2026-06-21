import { test, expect, type Page } from "@playwright/test";
import { getPlaywrightCredentials } from "./helpers/auth";

const SUCCESS_MESSAGE =
  /If an account is registered to this email, a reset password link will be sent to this email/i;

function forgotPasswordAlert(page: Page) {
  return page
    .getByRole("alert")
    .filter({ hasText: SUCCESS_MESSAGE });
}

test.describe("Forgot password", () => {
  test("POST with unknown email returns 404", async ({ request }) => {
    const response = await request.post("/api/forgotpassword", {
      data: { email: "e2e-no-account@example.com" },
    });
    expect(response.status()).toBe(404);
  });

  test("UI shows non-enumeration message for unknown email", async ({ page }) => {
    await page.goto("/forgotpassword");

    await page.locator("#signinemail").fill("e2e-no-account@example.com");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(forgotPasswordAlert(page)).toBeVisible({ timeout: 15_000 });
  });

  test("UI shows same success message for unknown and known email when API returns 200", async ({
    page,
  }) => {
    const creds = getPlaywrightCredentials();
    test.skip(!creds, "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

    await page.route("**/api/forgotpassword", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Password reset email was sent" }),
      });
    });

    await page.goto("/forgotpassword");

    await page.locator("#signinemail").fill("e2e-no-account@example.com");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(forgotPasswordAlert(page)).toBeVisible();

    await page.locator("#signinemail").fill(creds!.email);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(forgotPasswordAlert(page)).toBeVisible();
  });

  test("POST with known seeded email returns 200", async ({ request }) => {
    const creds = getPlaywrightCredentials();
    test.skip(!creds, "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

    const response = await request.post("/api/forgotpassword", {
      data: { email: creds!.email },
    });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Password reset email was sent",
    });
  });

  test("UI shows success message for known email via real API", async ({
    page,
  }) => {
    const creds = getPlaywrightCredentials();
    test.skip(!creds, "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

    await page.goto("/forgotpassword");
    await page.locator("#signinemail").fill(creds!.email);
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(forgotPasswordAlert(page)).toBeVisible({ timeout: 15_000 });
  });
});
