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
