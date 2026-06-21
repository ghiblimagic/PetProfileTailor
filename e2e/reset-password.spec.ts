import { test, expect } from "@playwright/test";
import { signOutViaNav } from "./helpers/auth";
import { registerNewUser } from "./helpers/register";
import {
  setE2ePasswordResetToken,
  submitResetPasswordForm,
} from "./helpers/reset-password";

test.describe("Reset password", () => {
  test("invalid token shows error and disables password fields", async ({
    page,
  }) => {
    await page.goto("/resetpassword/not-a-valid-reset-token");

    await expect(
      page.getByText(/Invalid reset token or token has expired/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#password")).toBeDisabled();
  });

  test("expired token shows error and disables password fields", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const profileName = `e2e${Date.now().toString(36)}`;
    const email = `e2e-expired-reset-${Date.now()}@example.com`;

    await registerNewUser(page, {
      name: "E2E Expired Reset",
      profilename: profileName,
      email,
      password: "testpass123",
    });

    const token = await setE2ePasswordResetToken(page, { expired: true });
    await signOutViaNav(page);

    await page.goto(`/resetpassword/${token}`);

    await expect(
      page.getByText(/Invalid reset token or token has expired/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#password")).toBeDisabled();
  });

  test("user resets password via token and signs in with new password", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const profileName = `e2e${Date.now().toString(36)}`;
    const email = `e2e-reset-${Date.now()}@example.com`;
    const originalPassword = "testpass123";
    const newPassword = "newpass456789";

    await registerNewUser(page, {
      name: "E2E Reset Test",
      profilename: profileName,
      email,
      password: originalPassword,
    });

    const token = await setE2ePasswordResetToken(page);
    await signOutViaNav(page);

    await page.goto(`/resetpassword/${token}`);
    await expect(page.locator("#password")).toBeEnabled({ timeout: 15_000 });

    await submitResetPasswordForm(page, newPassword);

    await page.waitForURL(/\/dashboard/, { timeout: 45_000 });

    await signOutViaNav(page);

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(newPassword);
    await page.getByRole("button", { name: "sign in", exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  });
});
