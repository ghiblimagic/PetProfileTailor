import { expect, type Page } from "@playwright/test";

export async function gotoFetchNamePage(page: Page): Promise<void> {
  await page.goto("/fetchname");
  await expect(page.getByText("Find A")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Name", { exact: true })).toBeVisible();
  await expect(page.locator("#checkExists")).toBeVisible();
}

export async function searchFetchName(page: Page, name: string): Promise<void> {
  await page.locator("#checkExists").fill(name);
  await page
    .getByRole("button", { name: "Search" })
    .filter({ has: page.locator("svg") })
    .click();
}
