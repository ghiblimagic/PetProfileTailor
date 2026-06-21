import { type Page } from "@playwright/test";

export async function setContactFormStartTime(
  page: Page,
  msAgo = 5000,
): Promise<void> {
  const start = Date.now() - msAgo;
  await page.locator('input[name="formStartTime"]').evaluate((el, t) => {
    (el as HTMLInputElement).value = String(t);
  }, start);
}

export async function fillContactForm(
  page: Page,
  fields: { name: string; email: string; message: string },
): Promise<void> {
  await page.locator('input[name="name"]').fill(fields.name);
  await page.locator('input[name="email"]').fill(fields.email);
  await page.locator('textarea[name="message"]').fill(fields.message);
}

export async function submitContactForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Submit" }).click();
}

/** Wait for the 3s minimum before submit (more reliable than patching the hidden field). */
export async function submitContactFormWithValidTiming(
  page: Page,
): Promise<void> {
  await page.waitForTimeout(3100);
  await submitContactForm(page);
}

export async function resetE2eContactRateLimit(
  request: import("@playwright/test").APIRequestContext,
): Promise<void> {
  const response = await request.post("/api/test/e2e/reset-contact-rate-limit");
  if (!response.ok()) {
    throw new Error(
      `reset-contact-rate-limit failed: ${response.status()} ${await response.text()}`,
    );
  }
}
