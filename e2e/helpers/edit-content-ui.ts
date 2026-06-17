import { expect, type Page } from "@playwright/test";

export async function openContentEditDialog(page: Page): Promise<void> {
  await page.getByRole("button", { name: "More options" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

export async function selectTagInEditDialog(
  page: Page,
  categoryLabel: string,
  tagLabel: string,
): Promise<void> {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Open", exact: true }).click();
  await dialog.getByRole("button", { name: categoryLabel, exact: true }).click();
  await dialog
    .locator('[id^="headlessui-disclosure-panel"]')
    .getByText(tagLabel, { exact: true })
    .click();
}

export async function fillEditDialogNotes(
  page: Page,
  notes: string,
): Promise<void> {
  const notesField = page
    .getByRole("dialog")
    .getByRole("heading", { name: "Notes" })
    .locator("xpath=following-sibling::*[1]");
  await notesField.fill(notes);
}

export async function saveContentEdit(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog");
  const saveButton = dialog.getByRole("button", { name: "Save" });
  await expect(saveButton).toBeEnabled({ timeout: 15_000 });

  const responsePromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      return (
        response.request().method() === "PUT" &&
        (url.endsWith("/api/names") || url.endsWith("/api/description"))
      );
    },
  );

  await saveButton.click();
  const response = await responsePromise;
  const body = await response.text();
  expect(
    response.ok(),
    `PUT ${response.url()} returned ${response.status()}: ${body.slice(0, 200)}`,
  ).toBeTruthy();
}
