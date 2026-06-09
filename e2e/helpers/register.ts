import { type Page } from "@playwright/test";
export { getPlaywrightProfileName } from "../fixtures/seed-data";

export async function fillRegisterForm(
  page: Page,
  fields: {
    name: string;
    profilename: string;
    email: string;
    password: string;
  },
): Promise<void> {
  await page.locator("#over13").check();
  await page.locator("#name").fill(fields.name);
  await page.locator("#profilename").fill(fields.profilename);
  await page.locator("#email").fill(fields.email);
  await page.locator("#password").fill(fields.password);
  await page.locator("#confirmPassword").fill(fields.password);
}

export async function submitRegisterForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "register" }).click();
}
