import { test, expect } from "@playwright/test";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightCredentials,
  loginWithAdminCredentials,
  loginWithCredentials,
  signOutViaNav,
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
  tagIdsFromSeededContent,
} from "./helpers/seed-lookup";
import {
  ensureDescriptionLiked,
  ensureDescriptionUnliked,
  ensureNameLiked,
  ensureNameUnliked,
  readDetailPageLikeCount,
} from "./helpers/likes";

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

test.describe("likedByCount unchanged on owner edit", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
    "PLAYWRIGHT_TEST and ADMIN credentials required",
  );

  test("name — API edit preserves like count on detail page", async ({
    page,
  }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);
    const contentCreator = {
      _id: seeded.creatorId,
      name: seeded.createdBy.name,
      profileName: seeded.createdBy.profileName,
    };

    await loginWithAdminCredentials(page);
    await ensureNameUnliked(page.request, seeded.id, contentCreator);
    await ensureNameLiked(page.request, seeded.id, contentCreator);

    await page.goto(`/name/${SEED_NAME}`);
    const before = await readDetailPageLikeCount(page);

    await signOutViaNav(page);
    await loginWithCredentials(page);

    const notes = `E2E likedByCount API ${Date.now().toString(36)}`;
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

    await page.goto(`/name/${SEED_NAME}`);
    await expect(page.getByText(notes)).toBeVisible({ timeout: 15_000 });
    expect(await readDetailPageLikeCount(page)).toBe(before);
  });

  test("description — API edit preserves like count on detail page", async ({
    page,
  }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );
    const contentCreator = {
      _id: seeded.creatorId,
      name: seeded.createdBy.name,
      profileName: seeded.createdBy.profileName,
    };

    await loginWithAdminCredentials(page);
    await ensureDescriptionUnliked(page.request, seeded.id, contentCreator);
    await ensureDescriptionLiked(page.request, seeded.id, contentCreator);

    await page.goto(`/description/${seeded.id}`);
    const before = await readDetailPageLikeCount(page);

    await signOutViaNav(page);
    await loginWithCredentials(page);

    const notes = `E2E likedByCount API ${Date.now().toString(36)}`;
    const response = await page.request.put("/api/description", {
      data: {
        submission: {
          contentId: seeded.id,
          content: seeded.content,
          notes,
          tags: tagIdsFromSeededContent(seeded),
        },
      },
    });
    expect(response.ok()).toBeTruthy();

    await page.goto(`/description/${seeded.id}`);
    await expect(page.getByText(notes)).toBeVisible({ timeout: 15_000 });
    expect(await readDetailPageLikeCount(page)).toBe(before);
  });

  test("name — UI edit preserves like count on detail page", async ({
    page,
  }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);
    const contentCreator = {
      _id: seeded.creatorId,
      name: seeded.createdBy.name,
      profileName: seeded.createdBy.profileName,
    };

    await loginWithAdminCredentials(page);
    await ensureNameUnliked(page.request, seeded.id, contentCreator);
    await ensureNameLiked(page.request, seeded.id, contentCreator);

    await signOutViaNav(page);
    await loginWithCredentials(page);

    await page.goto(`/name/${SEED_NAME}`);
    const before = await readDetailPageLikeCount(page);

    const notes = `UI likedByCount ${Date.now().toString(36)}`;
    await page.getByRole("button", { name: "More options" }).click();
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("dialog").locator("textarea").fill(notes);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(notes)).toBeVisible({ timeout: 15_000 });

    expect(await readDetailPageLikeCount(page)).toBe(before);
  });
});
