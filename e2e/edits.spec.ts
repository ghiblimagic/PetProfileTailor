import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";
import {
  SEED_DESCRIPTION_MIDDLE_CONTEXT,
  SEED_DESCRIPTION_START,
  SEED_NAME,
  SEED_NAME_ADMIN,
} from "./fixtures/seed-data";
import {
  lookupSeededDescription,
  lookupSeededName,
} from "./helpers/seed-lookup";

test.describe("Content edits and ownership", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("owner can update notes on seeded name via API", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);
    const notes = `E2E notes ${Date.now().toString(36)}`;

    const response = await page.request.put("/api/names", {
      data: {
        submission: {
          contentId: seeded.id,
          content: SEED_NAME,
          notes,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = (await response.json()) as { message?: string };
    expect(json.message).toMatch(/updated/i);
  });

  test("non-owner cannot update admin-owned name via API", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME_ADMIN);

    const response = await page.request.put("/api/names", {
      data: {
        submission: {
          contentId: seeded.id,
          content: SEED_NAME_ADMIN,
          notes: "Should not save",
        },
      },
    });

    expect(response.status()).toBe(403);
  });

  test("owner cannot edit description to duplicate another entry", async ({
    page,
  }) => {
    const owned = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );

    const response = await page.request.put("/api/description", {
      data: {
        submission: {
          contentId: owned.id,
          content: SEED_DESCRIPTION_MIDDLE_CONTEXT,
        },
      },
    });

    expect(response.status()).toBe(409);
  });

  test("owner can edit own seeded name notes in UI", async ({ page }) => {
    const notes = `UI notes ${Date.now().toString(36)}`;

    await page.goto(`/name/${SEED_NAME}`);
    await page.getByRole("button", { name: "More options" }).click();
    await page.getByRole("button", { name: "Edit" }).click();

    await page.getByRole("dialog").locator("textarea").fill(notes);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(notes)).toBeVisible({ timeout: 15_000 });
  });
});
