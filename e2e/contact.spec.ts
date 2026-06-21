import { test, expect } from "@playwright/test";
import { CONTACT_MESSAGE_LANGUAGE_ERROR } from "../utils/api/detectBotPatterns";
import {
  fillContactForm,
  resetE2eContactRateLimit,
  setContactFormStartTime,
  submitContactForm,
  submitContactFormWithValidTiming,
} from "./helpers/contact";

const E2E_SKIP_MESSAGE = "E2E test mode — email send skipped.";
const SPAM_NAME = "pvYPqHYUHlHCZOycCCz";
const SPAM_MESSAGE = "atThmePQOohIAlvlCoAYanEC";

test.describe("Contact page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("shows form fields and English/Spanish rule", async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.getByText("English or Spanish only")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  test("rejects submissions that are too fast", async ({ page }) => {
    await fillContactForm(page, {
      name: "Janet Test",
      email: "test@example.com",
      message: "Hello, I have a question about pet adoption.",
    });
    await page.locator('input[name="formStartTime"]').evaluate((el) => {
      (el as HTMLInputElement).value = String(Date.now());
    });

    await submitContactForm(page);

    await expect(page.getByText("Form submitted too quickly.")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("rejects non-English/Spanish messages", async ({ page }) => {
    await fillContactForm(page, {
      name: "Janet Test",
      email: "test@example.com",
      message: "こんにちは、里親について質問があります。",
    });

    await submitContactFormWithValidTiming(page);

    await expect(page.getByText(CONTACT_MESSAGE_LANGUAGE_ERROR)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("allows Spanish messages (passes validation)", async ({ page }) => {
    await fillContactForm(page, {
      name: "Janet Test",
      email: "test@example.com",
      message: "Hola, tengo una pregunta sobre adopcion de mascotas.",
    });

    await submitContactFormWithValidTiming(page);

    await expect(page.getByText(CONTACT_MESSAGE_LANGUAGE_ERROR)).not.toBeVisible();
    await expect(page.locator("p.text-red-600").filter({ hasText: E2E_SKIP_MESSAGE })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("rejects gibberish spam message", async ({ page }) => {
    await fillContactForm(page, {
      name: "Janet Test",
      email: "test@example.com",
      message: SPAM_MESSAGE,
    });

    await submitContactFormWithValidTiming(page);

    await expect(
      page.getByText("Message contains invalid content."),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("rejects gibberish spam name", async ({ page }) => {
    await fillContactForm(page, {
      name: SPAM_NAME,
      email: "test@example.com",
      message: "Hello, I have a normal question about adoption.",
    });

    await submitContactFormWithValidTiming(page);

    await expect(
      page.getByText("Message contains invalid content."),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("allows legitimate long names", async ({ page }) => {
    await fillContactForm(page, {
      name: "Wojciechowski",
      email: "test@example.com",
      message: "Hello, I have a question about pet adoption.",
    });

    await submitContactFormWithValidTiming(page);

    await expect(page.locator("p.text-red-600").filter({ hasText: E2E_SKIP_MESSAGE })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("rate limits repeated valid submissions", async ({ page, request }) => {
    await resetE2eContactRateLimit(request);

    const fields = {
      name: "Janet Test",
      email: `rate-limit-${Date.now()}@example.com`,
      message: "Hello, I have a question about pet adoption.",
    };

    for (let i = 0; i < 3; i += 1) {
      await page.goto("/contact");
      await fillContactForm(page, fields);
      await submitContactFormWithValidTiming(page);
      await expect(
        page.locator("p.text-red-600").filter({ hasText: E2E_SKIP_MESSAGE }),
      ).toBeVisible({ timeout: 15_000 });
    }

    await page.goto("/contact");
    await fillContactForm(page, fields);
    await submitContactFormWithValidTiming(page);

    await expect(page.getByText(/Too many requests/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
