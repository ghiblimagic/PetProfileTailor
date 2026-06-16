import { type Page } from "@playwright/test";

export function descriptionInput(page: Page) {
  return page.locator("#descriptionInput");
}

export async function fillDescriptionContent(
  page: Page,
  content: string,
): Promise<void> {
  await descriptionInput(page).fill(content);
}

export async function submitDescriptionForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Add description/i }).click();
}

export async function clickDescriptionExistsSearch(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Search" })
    .filter({ has: page.locator("svg") })
    .click();
}
