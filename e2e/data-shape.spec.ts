import { test, expect } from "@playwright/test";
import {
  SEED_DESCRIPTION_START,
  SEED_NAME,
} from "./fixtures/seed-data";
import {
  expectLikeNotificationLeanShape,
  expectNoVersionKey,
  expectStringId,
  expectThankNotificationLeanShape,
} from "./helpers/data-shape";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightCredentials,
  loginWithAdminCredentials,
  loginWithCredentials,
  signOutViaNav,
} from "./helpers/auth";
import { getPlaywrightAdminProfileName } from "./fixtures/seed-data";
import { ensureDescriptionLiked, ensureNameLiked } from "./helpers/likes";
import {
  lookupSeededDescription,
  lookupSeededName,
} from "./helpers/seed-lookup";
import { submitThanks } from "./helpers/thanks";

test.describe("API data shape (leanWithStrings)", () => {
  test("name check-if-content-exists returns string ids without __v", async ({
    request,
  }) => {
    const response = await request.get(
      `/api/names/check-if-content-exists/${encodeURIComponent(SEED_NAME)}`,
    );
    expect(response.ok()).toBeTruthy();

    const json = (await response.json()) as {
      type: string;
      data?: Record<string, unknown> & {
        _id: unknown;
        createdBy?: { _id?: unknown };
        tags?: Array<{ _id?: unknown; tag?: string }>;
      };
    };

    expect(json.type).toBe("duplicate");
    expect(json.data).toBeTruthy();

    const data = json.data!;
    expectStringId(data._id, "name._id");
    expectNoVersionKey(data, "name");
    expectStringId(data.createdBy?._id, "name.createdBy._id");

    if (data.tags?.length) {
      expectStringId(data.tags[0]._id, "name.tags[0]._id");
      expect(typeof data.tags[0].tag).toBe("string");
    }
  });

  test("description check-if-content-exists returns string ids without __v", async ({
    request,
  }) => {
    const response = await request.get(
      `/api/description/check-if-content-exists/${encodeURIComponent(SEED_DESCRIPTION_START)}`,
    );
    expect(response.ok()).toBeTruthy();

    const json = (await response.json()) as {
      type: string;
      data?: Record<string, unknown> & {
        _id: unknown;
        createdBy?: { _id?: unknown };
        tags?: Array<{ _id?: unknown; tag?: string }>;
      };
    };

    expect(json.type).toBe("duplicate");
    expect(json.data).toBeTruthy();

    const data = json.data!;
    expectStringId(data._id, "description._id");
    expectNoVersionKey(data, "description");
    expectStringId(data.createdBy?._id, "description.createdBy._id");

    if (data.tags?.length) {
      const firstTag = data.tags[0];
      if (typeof firstTag === "string") {
        expectStringId(firstTag, "description.tags[0]");
      } else if (firstTag?._id !== undefined) {
        expectStringId(firstTag._id, "description.tags[0]._id");
        if (firstTag.tag !== undefined) {
          expect(typeof firstTag.tag).toBe("string");
        }
      }
    }
  });

  test.describe("authenticated", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
      await loginWithCredentials(page);
    });

    test("GET /api/user/likes returns string id and contentId entries", async ({
      page,
    }) => {
      const response = await page.request.get("/api/user/likes");
      expect(response.ok()).toBeTruthy();

      const json = (await response.json()) as {
        names?: Array<{ id?: unknown; contentId?: unknown; __v?: unknown }>;
        descriptions?: Array<{ id?: unknown; contentId?: unknown; __v?: unknown }>;
      };

      for (const entry of [...(json.names ?? []), ...(json.descriptions ?? [])]) {
        expectStringId(entry.id, "likes.id");
        expectStringId(entry.contentId, "likes.contentId");
        expectNoVersionKey(entry as Record<string, unknown>, "likes entry");
      }
    });
  });

  test.describe("notification APIs (leanWithStrings)", () => {
    test.describe.configure({ mode: "serial" });

    test.skip(
      !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
      "PLAYWRIGHT_TEST and ADMIN credentials required",
    );

    test("GET /api/notifications/names returns string ids without __v", async ({
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
        likedBy?: Record<string, unknown> & { _id?: unknown };
        contentId?: Record<string, unknown> & { _id?: unknown };
        __v?: unknown;
      }>;

      const fromAdmin = notifications.find(
        (n) =>
          (n.likedBy as { profileName?: string } | undefined)?.profileName?.toLowerCase() ===
          getPlaywrightAdminProfileName(),
      );
      expect(fromAdmin).toBeTruthy();
      expectLikeNotificationLeanShape(fromAdmin!, "name notification");
      expectNoVersionKey(fromAdmin as Record<string, unknown>, "name notification");
    });

    test("GET /api/notifications/descriptions returns string ids without __v", async ({
      page,
    }) => {
      const seeded = await lookupSeededDescription(
        page.request,
        SEED_DESCRIPTION_START,
      );

      await loginWithAdminCredentials(page);
      await ensureDescriptionLiked(page.request, seeded.id, {
        _id: seeded.creatorId,
        name: seeded.createdBy.name,
        profileName: seeded.createdBy.profileName,
      });

      await signOutViaNav(page);
      await loginWithCredentials(page);

      const response = await page.request.get("/api/notifications/descriptions");
      expect(response.ok()).toBeTruthy();

      const notifications = (await response.json()) as Array<{
        likedBy?: Record<string, unknown> & { _id?: unknown };
        contentId?: Record<string, unknown> & { _id?: unknown };
        __v?: unknown;
      }>;

      const fromAdmin = notifications.find(
        (n) =>
          (n.likedBy as { profileName?: string } | undefined)?.profileName?.toLowerCase() ===
          getPlaywrightAdminProfileName(),
      );
      expect(fromAdmin).toBeTruthy();
      expectLikeNotificationLeanShape(fromAdmin!, "description notification");
      expectNoVersionKey(
        fromAdmin as Record<string, unknown>,
        "description notification",
      );
    });

    test("GET /api/notifications/thanks returns string ids without __v", async ({
      page,
    }) => {
      const seeded = await lookupSeededName(page.request, SEED_NAME);

      await loginWithAdminCredentials(page);
      await submitThanks(page.request, {
        contentType: "names",
        contentId: seeded.id,
        contentCreator: seeded.creatorId,
      });

      await signOutViaNav(page);
      await loginWithCredentials(page);

      const response = await page.request.get("/api/notifications/thanks");
      expect(response.ok()).toBeTruthy();

      const notifications = (await response.json()) as Array<{
        thanksBy?: Record<string, unknown> & { _id?: unknown };
        nameId?: Record<string, unknown> & { _id?: unknown };
        __v?: unknown;
      }>;

      const fromAdmin = notifications.find(
        (n) =>
          (n.thanksBy as { profileName?: string } | undefined)?.profileName?.toLowerCase() ===
          getPlaywrightAdminProfileName(),
      );
      expect(fromAdmin).toBeTruthy();
      expectThankNotificationLeanShape(fromAdmin!, "thank notification");
      expectNoVersionKey(fromAdmin as Record<string, unknown>, "thank notification");
    });
  });
});
