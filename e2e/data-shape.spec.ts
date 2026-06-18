import { test, expect } from "@playwright/test";
import {
  SEED_DESCRIPTION_START,
  SEED_NAME,
} from "./fixtures/seed-data";
import {
  expectNoVersionKey,
  expectStringId,
} from "./helpers/data-shape";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";

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
});
