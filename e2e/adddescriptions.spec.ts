import { test, expect } from "@playwright/test";
import { getPlaywrightCredentials, loginWithCredentials } from "./helpers/auth";
import {
  clickDescriptionExistsSearch,
  fillDescriptionContent,
  submitDescriptionForm,
} from "./helpers/descriptions";
import {
  hashedTagText,
  SEED_DESCRIPTION_FILTER_TAG,
  submitDescriptionWithTags,
} from "./helpers/adddescriptions-ui";
import {
  SEED_DESCRIPTION_MIDDLE_MARKER,
  SEED_DESCRIPTION_START_PREFIX,
} from "./fixtures/seed-data";

test.describe("Add descriptions page", () => {
  test("logged-out visitor sees sign-in gate", async ({ page }) => {
    await page.goto("/adddescriptions");
    await expect(
      page.getByText("Please sign in to submit a description"),
    ).toBeVisible();
    await expect(page.locator("#descriptionInput")).toBeDisabled();
  });
});

test.describe("Add descriptions page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("submits a unique description and opens detail page", async ({ page }) => {
    const uniqueContent = `E2E description ${Date.now().toString(36)} with enough length`;

    await page.goto("/adddescriptions");
    await fillDescriptionContent(page, uniqueContent);

    const createResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/description") &&
        res.request().method() === "POST" &&
        res.status() === 201,
    );
    await submitDescriptionForm(page);
    const response = await createResponse;
    const body = (await response.json()) as { _id: string };

    await expect(page.getByText(/Successfully added description/i)).toBeVisible({
      timeout: 15_000,
    });

    const detailResponse = await page.goto(`/description/${body._id}`);
    expect(detailResponse?.status()).toBeLessThan(500);
    await expect(page.getByText("User not found")).not.toBeVisible();
  });

  test("rejects blocklisted substring in description", async ({ page }) => {
    await page.goto("/adddescriptions");
    await fillDescriptionContent(
      page,
      "This friendly dog wank test phrase is long enough",
    );
    await submitDescriptionForm(page);

    await expect(
      page.getByText(/any content containing the phrase wank is not allowed/i),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("check-if-exists flags duplicate at start of seeded description", async ({
    page,
  }) => {
    await page.goto("/adddescriptions");
    await fillDescriptionContent(page, SEED_DESCRIPTION_START_PREFIX);
    await clickDescriptionExistsSearch(page);

    await expect(page.getByText(/already exists/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("check-if-exists does not flag seeded marker only in middle", async ({
    page,
  }) => {
    await page.goto("/adddescriptions");
    await fillDescriptionContent(page, SEED_DESCRIPTION_MIDDLE_MARKER);
    await clickDescriptionExistsSearch(page);

    await expect(
      page.getByText("Success! That content is not in the database"),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("submitted description with tag shows tag on detail page", async ({
    page,
  }) => {
    const uniqueContent = `E2E description with tag ${Date.now().toString(36)} and enough length here`;

    await page.goto("/adddescriptions");
    const { status, id } = await submitDescriptionWithTags(page, uniqueContent);
    expect(status).toBe(201);

    await expect(page.getByText(/Successfully added description/i)).toBeVisible({
      timeout: 15_000,
    });

    const detailResponse = await page.goto(`/description/${id}`);
    expect(detailResponse?.status()).toBeLessThan(500);
    await expect(page.getByText(uniqueContent, { exact: false })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(hashedTagText(SEED_DESCRIPTION_FILTER_TAG), { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
