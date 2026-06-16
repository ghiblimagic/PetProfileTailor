import { expect, type Page } from "@playwright/test";
import { gotoNameDetail } from "./thanks-ui";

export { gotoNameDetail };

export function listingMoreOptionsButton(page: Page) {
  return page.getByRole("button", { name: "More options" });
}

export function moderationDialog(page: Page) {
  return page.getByRole("dialog");
}

/** Name detail with user suggestions/reports context fetch settled (best-effort). */
export async function gotoNameDetailForModeration(
  page: Page,
  name: string,
): Promise<void> {
  const suggestionsFetch = page.waitForResponse(
    (response) =>
      response.url().includes("/api/user/suggestions") &&
      response.request().method() === "GET",
  );
  const reportsFetch = page.waitForResponse(
    (response) =>
      response.url().includes("/api/user/reports") &&
      response.request().method() === "GET",
  );

  await gotoNameDetail(page, name);

  await Promise.all([
    suggestionsFetch.catch(() => undefined),
    reportsFetch.catch(() => undefined),
  ]);
}

export async function openListingMenuItem(
  page: Page,
  itemName: "Suggestion" | "Report",
): Promise<void> {
  await listingMoreOptionsButton(page).click();
  await page.getByRole("button", { name: itemName }).click();
}

export async function expectEditSuggestionDialog(
  page: Page,
  name: string,
): Promise<void> {
  const dialog = moderationDialog(page);
  const editHeading = dialog.getByRole("heading", { name: "Edit Suggestion" });

  if (await editHeading.isVisible().catch(() => false)) {
    await expect(editHeading).toBeVisible();
    return;
  }

  await dialog
    .getByRole("button", { name: "Cancel" })
    .click()
    .catch(() => undefined);
  await gotoNameDetailForModeration(page, name);
  await openListingMenuItem(page, "Suggestion");
  await expect(editHeading).toBeVisible({ timeout: 15_000 });
}

export async function expectEditReportDialog(
  page: Page,
  name: string,
): Promise<void> {
  const dialog = moderationDialog(page);
  const editHeading = dialog.getByRole("heading", {
    name: "Edit or Delete Report",
  });

  if (await editHeading.isVisible().catch(() => false)) {
    await expect(editHeading).toBeVisible();
    return;
  }

  await dialog
    .getByRole("button", { name: "Cancel" })
    .click()
    .catch(() => undefined);
  await gotoNameDetailForModeration(page, name);
  await openListingMenuItem(page, "Report");
  await expect(editHeading).toBeVisible({ timeout: 15_000 });
}

/**
 * Submit new suggestion form (add flow only). Returns POST status.
 */
export async function submitSuggestionDialog(
  page: Page,
  comment = "E2E UI suggestion with enough detail for the API",
): Promise<number> {
  const dialog = moderationDialog(page);

  await expect(
    dialog.getByRole("heading", { name: "Suggestions" }),
  ).toBeVisible({ timeout: 15_000 });

  const textareas = dialog.locator("textarea");
  await textareas.first().fill("E2E suggested note change");
  await textareas.last().fill(comment);

  const submitButton = dialog.getByRole("button", { name: "Submit" });
  await expect(submitButton).toBeEnabled({ timeout: 15_000 });

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/suggestion") &&
      response.request().method() === "POST",
  );

  await submitButton.click();
  const response = await responsePromise;
  return response.status();
}

/**
 * Submit new report form (add flow only). Returns POST status.
 */
export async function submitReportDialog(page: Page): Promise<number> {
  const dialog = moderationDialog(page);

  await expect(
    dialog.getByRole("heading", { name: "Report Content" }),
  ).toBeVisible({ timeout: 15_000 });

  await dialog.getByText("Spam", { exact: true }).click();

  const submitButton = dialog.getByRole("button", { name: "Submit" });
  await expect(submitButton).toBeEnabled({ timeout: 15_000 });

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/flag/flagreportsubmission") &&
      response.request().method() === "POST",
  );

  await submitButton.click();
  const response = await responsePromise;
  return response.status();
}

export async function expectSuggestionSuccessToast(page: Page): Promise<void> {
  await expect(
    page.getByText(/suggestion successfully sent/i),
  ).toBeVisible({ timeout: 10_000 });
}

export async function expectReportSuccessToast(page: Page): Promise<void> {
  await expect(
    page.getByText(/report for .* successfully sent/i),
  ).toBeVisible({ timeout: 10_000 });
}
