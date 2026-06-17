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
  SEED_DESCRIPTION_FILTER_CATEGORY,
  SEED_DESCRIPTION_FILTER_TAG,
  SEED_NAME,
  SEED_NAME_ADMIN,
  SEED_NAME_TAG_ATTACH_CATEGORY,
  SEED_NAME_TAG_FOR_ADD_NAMES,
} from "./fixtures/seed-data";
import {
  hashedTagText as hashedNameTagText,
} from "./helpers/addnames-ui";
import {
  hashedTagText as hashedDescriptionTagText,
} from "./helpers/adddescriptions-ui";
import {
  fillEditDialogNotes,
  openContentEditDialog,
  saveContentEdit,
  selectTagInEditDialog,
} from "./helpers/edit-content-ui";
import {
  lookupSeededDescription,
  lookupSeededName,
  seededHasTagSlug,
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
  test.describe.configure({ mode: "serial" });

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
    await openContentEditDialog(page);
    await fillEditDialogNotes(page, notes);
    await saveContentEdit(page);

    await expect(page.getByText(notes)).toBeVisible({ timeout: 15_000 });
  });

  test("owner can edit own seeded description notes in UI", async ({
    page,
  }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );
    const notes = `UI desc notes ${Date.now().toString(36)}`;

    await page.goto(`/description/${seeded.id}`);
    await openContentEditDialog(page);
    await fillEditDialogNotes(page, notes);
    await saveContentEdit(page);

    await expect(page.getByText(notes)).toBeVisible({ timeout: 15_000 });
  });

  test("owner can attach tag to seeded name via UI edit", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);
    const tagText = hashedNameTagText(SEED_NAME_TAG_FOR_ADD_NAMES);

    await page.goto(`/name/${SEED_NAME}`);

    if (!seededHasTagSlug(seeded, SEED_NAME_TAG_FOR_ADD_NAMES)) {
      await openContentEditDialog(page);
      await selectTagInEditDialog(
        page,
        SEED_NAME_TAG_ATTACH_CATEGORY,
        SEED_NAME_TAG_FOR_ADD_NAMES,
      );
      await saveContentEdit(page);
    }

    await expect(page.getByText(tagText, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("owner can attach tag to seeded description via UI edit", async ({
    page,
  }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );
    const tagText = hashedDescriptionTagText(SEED_DESCRIPTION_FILTER_TAG);

    await page.goto(`/description/${seeded.id}`);

    if (!seededHasTagSlug(seeded, SEED_DESCRIPTION_FILTER_TAG)) {
      await openContentEditDialog(page);
      await selectTagInEditDialog(
        page,
        SEED_DESCRIPTION_FILTER_CATEGORY,
        SEED_DESCRIPTION_FILTER_TAG,
      );
      await saveContentEdit(page);
    }

    await expect(page.getByText(tagText, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
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
    await openContentEditDialog(page);
    await fillEditDialogNotes(page, notes);
    await saveContentEdit(page);
    await expect(page.getByText(notes)).toBeVisible({ timeout: 15_000 });

    expect(await readDetailPageLikeCount(page)).toBe(before);
  });
});
