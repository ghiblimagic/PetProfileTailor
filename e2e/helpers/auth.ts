import { expect, type Page } from "@playwright/test";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightAdminDisplayName,
} from "../fixtures/seed-data";

export { getPlaywrightAdminCredentials } from "../fixtures/seed-data";

export function getPlaywrightCredentials():
  | { email: string; password: string }
  | null {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

/** Credentials login — requires PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD in test DB. */
export async function loginWithCredentials(page: Page): Promise<void> {
  const creds = getPlaywrightCredentials();
  if (!creds) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required",
    );
  }

  await page.goto("/login");
  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: "sign in", exact: true }).click();

  // Dashboard redirect after session hydrates (see login.jsx redirect effect)
  const reachedDashboard = await page
    .waitForURL(/\/dashboard/, { timeout: 45_000 })
    .then(() => true)
    .catch(() => false);

  if (reachedDashboard) return;

  // Fallback: session may be valid even if client redirect lagged
  await page.goto("/addnames");
  const nameInput = page.locator("#nameInput");
  if (await nameInput.isEnabled().catch(() => false)) return;

  throw new Error(
    `Login failed (still on ${page.url()}). Confirm PLAYWRIGHT_TEST_EMAIL/PASSWORD match a password user in MONGODB_URI_TEST — register via pnpm build:e2e && pnpm start:e2e.`,
  );
}

/** Admin credentials login — requires seeded admin in MONGODB_URI_TEST. */
export async function loginWithAdminCredentials(page: Page): Promise<void> {
  const creds = getPlaywrightAdminCredentials();
  if (!creds) {
    throw new Error("PLAYWRIGHT_TEST_ADMIN_EMAIL/PASSWORD are required");
  }

  await page.goto("/login");
  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: "sign in", exact: true }).click();

  const reachedDashboard = await page
    .waitForURL(/\/dashboard/, { timeout: 45_000 })
    .then(() => true)
    .catch(() => false);

  if (reachedDashboard) return;

  await page.goto("/dashboard");
  await expect(
    page.getByText(new RegExp(getPlaywrightAdminDisplayName(), "i")),
  ).toBeVisible({ timeout: 10_000 });
}

/** Use after loginWithCredentials when the test targets /addnames. */
export async function expectLoggedInOnAddNames(page: Page): Promise<void> {
  await page.goto("/addnames");
  await expect(page.locator("#nameInput")).toBeEnabled({ timeout: 10_000 });
}

export async function openProfileMenu(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Open profile menu" }).click();
}

export async function signOutViaNav(page: Page): Promise<void> {
  await openProfileMenu(page);
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await page.waitForURL(/\/login/, { timeout: 15_000 });
}

/** E2E-only — set status for signed-in user, or pass email for unauthenticated cleanup. */
export async function setE2eUserStatus(
  page: Page,
  status: "active" | "banned",
  options?: { email?: string },
): Promise<void> {
  const response = await page.request.post("/api/test/e2e/set-user-status", {
    data: { status, ...(options?.email ? { email: options.email } : {}) },
  });
  expect(response.ok()).toBeTruthy();
}

export async function restorePlaywrightTestUserStatus(page: Page): Promise<void> {
  const creds = getPlaywrightCredentials();
  if (!creds) return;
  await setE2eUserStatus(page, "active", { email: creds.email });
}
