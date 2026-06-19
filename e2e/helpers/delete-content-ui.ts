import { expect, type Page } from "@playwright/test";
import { listingMoreOptionsButton } from "./moderation-ui";

export async function createUniqueNameViaUi(
  page: Page,
  name: string,
): Promise<void> {
  await page.goto("/addnames");
  await expect(page.locator("#nameInput")).toBeEnabled({ timeout: 10_000 });
  await page.locator("#nameInput").fill(name);
  await page.getByRole("button", { name: "Add name" }).click();
  await expect(
    page.getByText("Successfully added name", { exact: false }),
  ).toBeVisible({ timeout: 15_000 });
}

export async function deleteOwnedContentFromDetailPage(page: Page): Promise<void> {
  await listingMoreOptionsButton(page).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(
    page.getByText("Are you sure you want to delete this?"),
  ).toBeVisible({ timeout: 10_000 });

  const confirmButton = page
    .locator("button")
    .filter({ hasText: /Yes, I.m sure/i });
  await confirmButton.click({ force: true });

  await expect(
    page.getByRole("alert").filter({ hasText: /content deleted successfully/i }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("DELETED", { exact: true })).toBeVisible({
    timeout: 10_000,
  });
}
