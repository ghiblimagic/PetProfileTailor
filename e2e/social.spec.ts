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
import { ensureNameLiked } from "./helpers/likes";
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
});
