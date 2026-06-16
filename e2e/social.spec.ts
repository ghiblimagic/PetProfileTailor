import { test, expect } from "@playwright/test";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightCredentials,
  loginWithAdminCredentials,
  loginWithCredentials,
  signOutViaNav,
} from "./helpers/auth";
import {
  getPlaywrightAdminProfileName,
  getPlaywrightProfileName,
  SEED_NAME,
} from "./fixtures/seed-data";
import {
  ensureNameLiked,
  ensureNameUnliked,
  nameDetailLikeButton,
  postNameToggleLikeWithProductionRateLimit,
  rapidDoubleClick,
  likeThenUnlikeWithinDebounce,
  resetLikeToggleRateLimitForSession,
} from "./helpers/likes";
import {
  lookupSeededName,
  lookupUserByProfileName,
} from "./helpers/seed-lookup";

test.describe("Social interactions", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
    "PLAYWRIGHT_TEST and ADMIN credentials required",
  );

  test("admin like on user name appears in user notifications API", async ({
    page,
  }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);

    await loginWithAdminCredentials(page);
    await ensureNameLiked(page.request, seeded.id, {
      _id: seeded.creatorId,
      name: seeded.createdBy.name,
      profileName: seeded.createdBy.profileName,
    });

    await signOutViaNav(page);
    await loginWithCredentials(page);
    const response = await page.request.get("/api/notifications/names");
    expect(response.ok()).toBeTruthy();

    const notifications = (await response.json()) as Array<{
      likedBy?: { profileName?: string };
    }>;

    const adminProfile = getPlaywrightAdminProfileName();
    const fromAdmin = notifications.some(
      (n) => n.likedBy?.profileName?.toLowerCase() === adminProfile,
    );
    expect(fromAdmin).toBe(true);
  });

  test("self-like does not appear in notifications API", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);

    await loginWithCredentials(page);
    await ensureNameLiked(page.request, seeded.id, {
      _id: seeded.creatorId,
      name: seeded.createdBy.name,
      profileName: seeded.createdBy.profileName,
    });

    const response = await page.request.get("/api/notifications/names");
    expect(response.ok()).toBeTruthy();

    const notifications = (await response.json()) as Array<{
      contentId?: string | { _id?: string };
      likedBy?: string | { _id?: string };
    }>;

    const selfLike = notifications.some((n) => {
      const contentId =
        typeof n.contentId === "string"
          ? n.contentId
          : String(n.contentId?._id ?? "");
      const likedBy =
        typeof n.likedBy === "string"
          ? n.likedBy
          : String(n.likedBy?._id ?? "");
      return contentId === seeded.id && likedBy === seeded.creatorId;
    });
    expect(selfLike).toBeFalsy();
  });

  test("admin can follow regular user via API", async ({ page }) => {
    const regularProfile = getPlaywrightProfileName();
    const regularUser = await lookupUserByProfileName(
      page.request,
      regularProfile,
    );

    await loginWithAdminCredentials(page);
    const followResponse = await page.request.put("/api/user/updatefollows/", {
      data: {
        userToFollowId: regularUser._id,
        userFollowed: false,
      },
    });
    expect(followResponse.ok()).toBeTruthy();

    const updated = await lookupUserByProfileName(
      page.request,
      regularProfile,
    );
    const adminUser = await lookupUserByProfileName(
      page.request,
      getPlaywrightAdminProfileName(),
    );
    expect(updated.followers).toContain(adminUser._id);
  });

  test("grabusersfollowing lists followed users from Follow collection", async ({
    page,
  }) => {
    const regularProfile = getPlaywrightProfileName();
    const regularUser = await lookupUserByProfileName(
      page.request,
      regularProfile,
    );
    const adminUser = await lookupUserByProfileName(
      page.request,
      getPlaywrightAdminProfileName(),
    );

    await loginWithAdminCredentials(page);
    const followResponse = await page.request.put("/api/user/updatefollows/", {
      data: {
        userToFollowId: regularUser._id,
        userFollowed: false,
      },
    });
    expect(followResponse.ok()).toBeTruthy();

    const followingResponse = await page.request.get(
      `/api/user/grabusersfollowing/${adminUser._id}`,
    );
    expect(followingResponse.ok()).toBeTruthy();

    const following = (await followingResponse.json()) as Array<{
      _id: string;
      profileName?: string;
    }>;

    expect(
      following.some((user) => user._id === regularUser._id),
    ).toBeTruthy();
  });

  test("name detail like button debounces rapid double-click to one API call", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const seeded = await lookupSeededName(page.request, SEED_NAME);

    await loginWithAdminCredentials(page);
    await ensureNameUnliked(page.request, seeded.id, {
      _id: seeded.creatorId,
      name: seeded.createdBy.name,
      profileName: seeded.createdBy.profileName,
    });

    await page.goto(`/name/${SEED_NAME}`);
    await expect(page.getByText(SEED_NAME, { exact: false })).toBeVisible({
      timeout: 15_000,
    });

    const likeButton = nameDetailLikeButton(page);
    await expect(likeButton).toBeVisible({ timeout: 15_000 });
    await expect(likeButton).toHaveAttribute("aria-label", "Like");

    const initialCount = Number(
      (await likeButton.locator("span").textContent()) ?? "0",
    );

    const toggleStatuses: number[] = [];
    let countTogglePosts = false;
    page.on("response", (response) => {
      if (!countTogglePosts) return;
      if (
        response.url().includes("/api/names/likes/") &&
        response.url().includes("/togglelike") &&
        response.request().method() === "POST"
      ) {
        toggleStatuses.push(response.status());
      }
    });

    countTogglePosts = true;
    await rapidDoubleClick(page, likeButton);

    await expect
      .poll(() => toggleStatuses.length, { timeout: 5_000 })
      .toBe(1);

    // Debounce window is 500ms — wait briefly so a second request would have fired
    await page.waitForTimeout(400);

    expect(toggleStatuses).toHaveLength(1);
    expect(toggleStatuses[0]).toBeGreaterThanOrEqual(200);
    expect(toggleStatuses[0]).toBeLessThan(500);

    const finalCount = Number(
      (await likeButton.locator("span").textContent()) ?? "0",
    );
    expect(Math.abs(finalCount - initialCount)).toBeLessThanOrEqual(1);
  });

  test("name detail like button sends one POST after like then unlike settle", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const seeded = await lookupSeededName(page.request, SEED_NAME);

    await loginWithAdminCredentials(page);
    await ensureNameUnliked(page.request, seeded.id, {
      _id: seeded.creatorId,
      name: seeded.createdBy.name,
      profileName: seeded.createdBy.profileName,
    });

    await page.goto(`/name/${SEED_NAME}`);
    await expect(page.getByText(SEED_NAME, { exact: false })).toBeVisible({
      timeout: 15_000,
    });

    const likeButton = nameDetailLikeButton(page);
    await expect(likeButton).toBeVisible({ timeout: 15_000 });
    await expect(likeButton).toHaveAttribute("aria-label", "Like");

    const initialCount = Number(
      (await likeButton.locator("span").textContent()) ?? "0",
    );

    const toggleStatuses: number[] = [];
    let countTogglePosts = false;
    page.on("response", (response) => {
      if (!countTogglePosts) return;
      if (
        response.url().includes("/api/names/likes/") &&
        response.url().includes("/togglelike") &&
        response.request().method() === "POST"
      ) {
        toggleStatuses.push(response.status());
      }
    });

    countTogglePosts = true;
    await likeThenUnlikeWithinDebounce(page, likeButton, 200);

    await expect
      .poll(() => toggleStatuses.length, { timeout: 8_000 })
      .toBe(1);

    await page.waitForTimeout(600);

    expect(toggleStatuses).toHaveLength(1);
    expect(toggleStatuses[0]).toBeGreaterThanOrEqual(200);
    expect(toggleStatuses[0]).toBeLessThan(500);

    await expect(likeButton).toHaveAttribute("aria-label", "Like");

    const finalCount = Number(
      (await likeButton.locator("span").textContent()) ?? "0",
    );
    expect(finalCount).toBe(initialCount);
  });

  test("togglelike returns 429 on 4th POST with production rate limit", async ({
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
    await resetLikeToggleRateLimitForSession(page.request);

    const statuses: number[] = [];
    let fourthBody: { retryAfterSeconds?: number; message?: string } | undefined;

    for (let i = 0; i < 4; i++) {
      const result = await postNameToggleLikeWithProductionRateLimit(
        page.request,
        seeded.id,
        contentCreator,
      );
      statuses.push(result.status);
      if (i === 3) {
        fourthBody = result.body;
      }
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(fourthBody?.message).toMatch(/too many like updates/i);
    expect(typeof fourthBody?.retryAfterSeconds).toBe("number");
    expect(fourthBody!.retryAfterSeconds!).toBeGreaterThan(0);
  });
});
