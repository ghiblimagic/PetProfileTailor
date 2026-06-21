import { expect, type Page } from "@playwright/test";

export async function setE2ePasswordResetToken(
  page: Page,
  options?: { email?: string; expired?: boolean },
): Promise<string> {
  const response = await page.request.post(
    "/api/test/e2e/set-password-reset-token",
    {
      data: {
        ...(options?.email ? { email: options.email } : {}),
        ...(options?.expired ? { expired: true } : {}),
      },
    },
  );
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as { token: string };
  expect(body.token).toBeTruthy();
  return body.token;
}

export async function submitResetPasswordForm(
  page: Page,
  password: string,
): Promise<void> {
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.getByRole("button", { name: "Reset Password" }).click();
}
