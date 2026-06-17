import { test, expect } from "@playwright/test";
import {
  SEED_DESCRIPTION_FILTER_TAG,
  SEED_DESCRIPTION_START,
  SEED_DESCRIPTION_START_PREFIX,
  SEED_NAME,
  SEED_NAME_TAG_FOR_ADD_NAMES,
} from "./fixtures/seed-data";
import { hashedTagText as hashedNameTagText } from "./helpers/addnames-ui";
import { hashedTagText as hashedDescriptionTagText } from "./helpers/adddescriptions-ui";
import { lookupSeededDescription, lookupSeededName } from "./helpers/seed-lookup";

test.describe("Browse smoke", () => {
  test("/fetchnames loads without server error", async ({ page }) => {
    const response = await page.goto("/fetchnames");
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByText("Server error")).not.toBeVisible();
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("/fetchdescriptions loads without server error", async ({ page }) => {
    const response = await page.goto("/fetchdescriptions");
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByText("Server error")).not.toBeVisible();
  });

  test("names API returns string _id values without __v", async ({ request }) => {
    const response = await request.post("/api/names/swr", {
      data: { page: 1 },
    });
    expect(response.ok()).toBeTruthy();

    const json = (await response.json()) as {
      data?: Array<{ _id: unknown; __v?: unknown }>;
    };

    if (!json.data?.length) {
      test.skip(true, "No names in test DB to assert _id shape");
    }

    for (const item of json.data!) {
      expect(typeof item._id).toBe("string");
      expect(item.__v).toBeUndefined();
    }
  });

  test("descriptions API returns string _id values without __v", async ({
    request,
  }) => {
    const response = await request.post("/api/description/swr", {
      data: { page: 1 },
    });
    expect(response.ok()).toBeTruthy();

    const json = (await response.json()) as {
      data?: Array<{ _id: unknown; __v?: unknown }>;
    };

    if (!json.data?.length) {
      test.skip(true, "No descriptions in test DB to assert _id shape");
    }

    for (const item of json.data!) {
      expect(typeof item._id).toBe("string");
      expect(item.__v).toBeUndefined();
    }
  });

  test("name detail page renders seeded name and creator", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);

    const response = await page.goto(`/name/${SEED_NAME}`);
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByText(SEED_NAME, { exact: false })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(`@${seeded.createdBy.profileName}`, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText(hashedNameTagText(SEED_NAME_TAG_FOR_ADD_NAMES), {
        exact: true,
      }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("description detail page renders seeded content, creator, and tag", async ({
    page,
  }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );

    const response = await page.goto(`/description/${seeded.id}`);
    expect(response?.status()).toBeLessThan(500);

    await expect(
      page.getByText(SEED_DESCRIPTION_START_PREFIX, { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(`@${seeded.createdBy.profileName}`, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText(hashedDescriptionTagText(SEED_DESCRIPTION_FILTER_TAG), {
        exact: true,
      }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
