import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("shows magic link section and register link", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /login with a magic link/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    await expect(page.getByText("Sign in without a password!")).toBeVisible();
  });
});
