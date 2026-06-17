import { expect, type Page } from "@playwright/test";

/** Stub YouTube embed responses so iframe `onLoad` fires without external network. */
export async function stubYoutubeEmbeds(page: Page): Promise<void> {
  await page.route(/youtube-nocookie\.com/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!DOCTYPE html><html><body>e2e embed stub</body></html>",
    });
  });
}

export async function gotoLandingPage(page: Page): Promise<void> {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(500);
  await expect(
    page.getByRole("heading", { name: /Welcome to/i }),
  ).toBeVisible({ timeout: 15_000 });
}

export async function openLandingVideoButton(
  page: Page,
  buttonLabel: string,
): Promise<void> {
  await page.getByRole("button", { name: buttonLabel, exact: true }).click();
}

export function landingVideoIframe(page: Page, embedId: string) {
  return page.locator(
    `iframe[src="https://www.youtube-nocookie.com/embed/${embedId}"]`,
  );
}

export async function expectLandingVideoLoaded(
  page: Page,
  embedId: string,
  title: string,
): Promise<void> {
  const iframe = landingVideoIframe(page, embedId);
  await expect(iframe).toBeVisible({ timeout: 15_000 });
  await expect(iframe).toHaveAttribute("title", title);
  await expect(page.getByRole("button", { name: "close X" })).toBeVisible();
}

export async function closeLandingVideo(page: Page): Promise<void> {
  await page.getByRole("button", { name: "close X" }).click();
}
