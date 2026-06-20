import { expect, type Page } from "@playwright/test";
import { listingMoreOptionsButton } from "./moderation-ui";
import {
  fillDescriptionContent,
  submitDescriptionForm,
} from "./descriptions";

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

export async function createUniqueDescriptionViaUi(
  page: Page,
  content: string,
): Promise<{ id: string; content: string }> {
  await page.goto("/adddescriptions");
  await expect(page.locator("#descriptionInput")).toBeEnabled({ timeout: 10_000 });
  await fillDescriptionContent(page, content);

  const createResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/description") &&
      res.request().method() === "POST" &&
      res.status() === 201,
  );
  await submitDescriptionForm(page);
  const response = await createResponse;
  const body = (await response.json()) as { _id: string };

  await expect(
    page.getByText(/Successfully added description/i),
  ).toBeVisible({ timeout: 15_000 });

  return { id: body._id, content };
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
