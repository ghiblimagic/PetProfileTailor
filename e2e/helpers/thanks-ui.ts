import { expect, type Page } from "@playwright/test";
import { DEFAULT_THANK_MESSAGE } from "./thanks";

export { DEFAULT_THANK_MESSAGE };

/** Thanks action on name/description detail (`ContentListing` standalone). */
export function contentThankButton(page: Page) {
  return page.getByRole("button", { name: "Thank" });
}

export function thanksDialog(page: Page) {
  return page.getByRole("dialog");
}

export async function gotoNameDetail(page: Page, name: string): Promise<void> {
  await page.goto(`/name/${name}`);
  await expect(page.getByText(name, { exact: false })).toBeVisible({
    timeout: 15_000,
  });
}

export async function gotoDescriptionDetail(
  page: Page,
  descriptionId: string,
): Promise<void> {
  await page.goto(`/description/${descriptionId}`);
  await expect(contentThankButton(page)).toBeVisible({ timeout: 15_000 });
}

export async function openThanksDialog(page: Page): Promise<void> {
  const button = contentThankButton(page);
  await expect(button).toBeVisible({ timeout: 15_000 });
  await button.click();
  await expect(
    thanksDialog(page).getByRole("heading", { name: "Send Thanks" }),
  ).toBeVisible({ timeout: 10_000 });
}

export type ThanksDialogSubmitResult = {
  status: number;
  message?: string;
};

/**
 * Select thank tags and submit the dialog. Returns POST /api/thanks status + message.
 */
export async function submitThanksDialog(
  page: Page,
  messages: string[] = [DEFAULT_THANK_MESSAGE],
): Promise<ThanksDialogSubmitResult> {
  const dialog = thanksDialog(page);

  for (const message of messages) {
    // Checkbox input is visually hidden (sr-only-style); click the label text.
    await dialog.getByText(message, { exact: true }).click();
  }

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/thanks") &&
      response.request().method() === "POST",
  );

  await dialog.getByRole("button", { name: "Submit" }).click();
  const response = await responsePromise;
  const json = (await response.json().catch(() => ({}))) as {
    message?: string;
  };

  return { status: response.status(), message: json.message };
}

const MAX_THANKS_MESSAGE = /maximum thank you notes for this content/i;

/** Assert dialog submit succeeded or hit the per-content thank cap (idempotent). */
export async function expectThanksDialogSubmitted(
  page: Page,
  result: ThanksDialogSubmitResult,
): Promise<void> {
  if (result.status === 201) {
    await expectThanksSuccessToast(page);
    await expect(thanksDialog(page)).toHaveCount(0);
    return;
  }

  if (result.status === 400 && result.message?.match(MAX_THANKS_MESSAGE)) {
    return;
  }

  expect(result.status).toBeGreaterThanOrEqual(200);
  expect(result.status).toBeLessThan(300);
}

export async function expectThanksSuccessToast(page: Page): Promise<void> {
  await expect(
    page.getByText(/thank your note was successfully sent/i),
  ).toBeVisible({ timeout: 10_000 });
}
