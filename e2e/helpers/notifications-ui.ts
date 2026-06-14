import { expect, type Page } from "@playwright/test";

export function thanksTabButton(page: Page) {
  return page.getByRole("button", { name: /Thanks/i });
}

export function thanksUnreadBadge(page: Page) {
  return thanksTabButton(page).locator("span.bg-blue-700");
}

/** Opens Thanks tab and waits for the list API to finish. */
export async function openThanksTab(page: Page): Promise<void> {
  const thanksResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/notifications/thanks") &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await Promise.all([thanksResponse, thanksTabButton(page).click()]);
}

export async function gotoNotificationsPage(page: Page): Promise<void> {
  await page.goto("/notifications");
  await expect(
    page.getByText("Notifications", { exact: true }),
  ).toBeVisible({ timeout: 15_000 });
}

/** Switch away from Thanks before the 3s mark-read timer fires. */
export async function leaveThanksTabBeforeMarkRead(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Names/i }).click();
}
