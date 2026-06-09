import { test, expect } from "@playwright/test";
import { getPlaywrightCredentials } from "./helpers/auth";
import {
  fillRegisterForm,
  getPlaywrightProfileName,
  submitRegisterForm,
} from "./helpers/register";

test.describe("Register page", () => {
  test("rejects duplicate profile name from seeded test user", async ({
    page,
  }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

    const takenProfileName = getPlaywrightProfileName();
    const uniqueEmail = `e2e-dup-${Date.now()}@example.com`;

    await page.goto("/register");

    await fillRegisterForm(page, {
      name: "Duplicate Test",
      profilename: takenProfileName,
      email: uniqueEmail,
      password: "testpass123",
    });

    await submitRegisterForm(page);

    await expect(
      page.getByText("That profile name is already used!"),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("rejects duplicate email from seeded test user", async ({ page }) => {
    const creds = getPlaywrightCredentials();
    test.skip(!creds, "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");

    const uniqueProfile = `e2e${Date.now().toString(36)}`;

    await page.goto("/register");

    await fillRegisterForm(page, {
      name: "Duplicate Email Test",
      profilename: uniqueProfile,
      email: creds!.email,
      password: "testpass123",
    });

    await submitRegisterForm(page);

    await expect(page.getByText("Email is already used!")).toBeVisible({
      timeout: 15_000,
    });
  });
});
