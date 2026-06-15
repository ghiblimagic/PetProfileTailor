import { expect, type Page } from "@playwright/test";

export function thanksTabButton(page: Page) {
  return page.getByRole("button", { name: /Thanks/i });
}

export function descriptionsTabButton(page: Page) {
  return page.getByRole("button", { name: /Descriptions/i });
}

export function namesTabButton(page: Page) {
  return page.getByRole("button", { name: /Names/i });
}

export function namesUnreadBadge(page: Page) {
  return namesTabButton(page).locator("span.bg-blue-700");
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

/** Opens Descriptions tab and waits for the list API to finish. */
export async function openDescriptionsTab(page: Page): Promise<void> {
  const descriptionsResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/notifications/descriptions") &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await Promise.all([
    descriptionsResponse,
    descriptionsTabButton(page).click(),
  ]);
}

/** Opens Names tab and waits for the list API (tab is default on page load; use after switching away). */
export async function openNamesTab(page: Page): Promise<void> {
  const namesResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/notifications/names") &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await Promise.all([namesResponse, namesTabButton(page).click()]);
}

/** First matching notification row (serial E2E reruns append duplicate rows in test DB). */
export function notificationRow(
  page: Page,
  actionText: RegExp,
  contentSnippet: string,
) {
  return page
    .locator("div")
    .filter({ hasText: actionText })
    .filter({ hasText: contentSnippet })
    .first();
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

export async function leaveNamesTabBeforeMarkRead(page: Page): Promise<void> {
  await openThanksTab(page);
}
