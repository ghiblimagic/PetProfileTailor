import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
  signOutViaNav,
} from "./helpers/auth";
import { getPlaywrightProfileName, registerNewUser } from "./helpers/register";
import { lookupUserByProfileName } from "./helpers/seed-lookup";

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

  test("updates display name and persists on profile", async ({ page }) => {
    const creds = getPlaywrightCredentials()!;
    const profileName = getPlaywrightProfileName();
    const updatedName = `E2E Settings ${Date.now().toString(36)}`;

    await page.goto("/editsettings");
    await expect(page.locator("#name")).not.toHaveValue("", {
      timeout: 15_000,
    });

    await page.locator("#name").fill(updatedName);
    await page.locator("#email").fill(creds.email);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/update") &&
        response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Update Profile" }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    await expect(
      page.getByText(/profile updated successfully/i),
    ).toBeVisible({ timeout: 15_000 });

    const user = await lookupUserByProfileName(page.request, profileName);
    expect(user.name).toBe(updatedName);

    await page.goto(`/profile/${profileName}`);
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Edit settings password change", () => {
  test("updates password via settings form and allows login with new password", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const profileName = `e2e${Date.now().toString(36)}`;
    const email = `e2e-settings-pw-${Date.now()}@example.com`;
    const originalPassword = "testpass123";
    const newPassword = "newpass456789";

    await registerNewUser(page, {
      name: "E2E Settings Password",
      profilename: profileName,
      email,
      password: originalPassword,
    });

    await page.goto("/editsettings");
    await expect(page.locator("#name")).not.toHaveValue("", {
      timeout: 15_000,
    });

    await page.locator("#email").fill(email);
    await page.locator("#password").fill(newPassword);
    await page.locator("#confirmPassword").fill(newPassword);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/update") &&
        response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Update Profile" }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    await expect(
      page.getByText(/profile updated successfully/i),
    ).toBeVisible({ timeout: 15_000 });

    await signOutViaNav(page);

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(newPassword);
    await page.getByRole("button", { name: "sign in", exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 45_000 });

    await signOutViaNav(page);

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(originalPassword);
    await page.getByRole("button", { name: "sign in", exact: true }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
