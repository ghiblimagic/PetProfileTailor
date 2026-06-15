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
  SEED_DESCRIPTION_START,
  SEED_NAME,
} from "./fixtures/seed-data";
import { ensureDescriptionLiked, ensureNameLiked } from "./helpers/likes";
import {
  lookupSeededDescription,
  lookupSeededName,
} from "./helpers/seed-lookup";
import {
  expectSelfThankRejected,
  submitThanks,
} from "./helpers/thanks";

type LikeNotification = {
  read?: boolean;
  likedBy?: { _id?: string; profileName?: string; name?: string };
  contentId?: { _id?: string; content?: string };
};

type ThankNotification = {
  read?: boolean;
  thanksBy?: { _id?: string; profileName?: string; name?: string };
  nameId?: { _id?: string; content?: string };
  descriptionId?: { _id?: string; content?: string };
};

test.describe("Notifications API", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated GET returns 401", async ({ request }) => {
    for (const path of [
      "/api/notifications/names",
      "/api/notifications/descriptions",
      "/api/notifications/thanks",
    ]) {
      const response = await request.get(path);
      expect(response.status()).toBe(401);
    }
  });

  test.describe("authenticated", () => {
    test.skip(
      !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
      "PLAYWRIGHT_TEST and ADMIN credentials required",
    );

    test("name notifications populate likedBy and contentId (not bare ObjectIds)", async ({
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

      const notifications = (await response.json()) as LikeNotification[];
      const fromAdmin = notifications.find(
        (n) =>
          n.likedBy?.profileName?.toLowerCase() ===
          getPlaywrightAdminProfileName(),
      );

      expect(fromAdmin).toBeTruthy();
      expect(typeof fromAdmin!.likedBy!.profileName).toBe("string");
      expect(typeof fromAdmin!.contentId?.content).toBe("string");
    });

    test("description notifications populate after admin like", async ({
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

      const response = await page.request.get(
        "/api/notifications/descriptions",
      );
      expect(response.ok()).toBeTruthy();

      const notifications = (await response.json()) as LikeNotification[];
      const fromAdmin = notifications.find(
        (n) =>
          n.likedBy?.profileName?.toLowerCase() ===
          getPlaywrightAdminProfileName(),
      );

      expect(fromAdmin).toBeTruthy();
      expect(typeof fromAdmin!.likedBy!.profileName).toBe("string");
      expect(typeof fromAdmin!.contentId?.content).toBe("string");
    });

    test("thank notifications populate thanksBy and nameId after admin thanks user name", async ({
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

      const notifications = (await response.json()) as ThankNotification[];
      const fromAdmin = notifications.find(
        (n) =>
          n.thanksBy?.profileName?.toLowerCase() ===
          getPlaywrightAdminProfileName(),
      );

      expect(fromAdmin).toBeTruthy();
      expect(typeof fromAdmin!.thanksBy!.profileName).toBe("string");
      expect(fromAdmin!.nameId?.content).toBe(SEED_NAME);
    });

    test("thank notifications populate descriptionId after admin thanks user description", async ({
      page,
    }) => {
      const seeded = await lookupSeededDescription(
        page.request,
        SEED_DESCRIPTION_START,
      );

      await loginWithAdminCredentials(page);
      await submitThanks(page.request, {
        contentType: "descriptions",
        contentId: seeded.id,
        contentCreator: seeded.creatorId,
      });

      await signOutViaNav(page);
      await loginWithCredentials(page);

      const response = await page.request.get("/api/notifications/thanks");
      expect(response.ok()).toBeTruthy();

      const notifications = (await response.json()) as ThankNotification[];
      const fromAdmin = notifications.find(
        (n) =>
          n.thanksBy?.profileName?.toLowerCase() ===
            getPlaywrightAdminProfileName() &&
          n.descriptionId?.content === SEED_DESCRIPTION_START,
      );

      expect(fromAdmin).toBeTruthy();
      expect(typeof fromAdmin!.thanksBy!.profileName).toBe("string");
      expect(typeof fromAdmin!.descriptionId?.content).toBe("string");
    });

    test("self-thank is rejected by thanks API", async ({ page }) => {
      const seeded = await lookupSeededName(page.request, SEED_NAME);

      await loginWithCredentials(page);
      await expectSelfThankRejected(page.request, {
        contentType: "names",
        contentId: seeded.id,
        contentCreator: seeded.creatorId,
      });
    });

    test("PATCH thanks mark-read sets read on thank notifications", async ({
      page,
    }) => {
      await loginWithCredentials(page);

      const before = await page.request.get("/api/notifications/thanks");
      expect(before.ok()).toBeTruthy();
      const beforeJson = (await before.json()) as ThankNotification[];

      test.skip(
        beforeJson.length === 0,
        "No thank notifications in test DB — run after thank tests or re-seed",
      );

      const hasUnread = beforeJson.some((n) => n.read === false);
      expect(hasUnread).toBeTruthy();

      const patch = await page.request.patch(
        "/api/notifications/thanks/mark-read",
      );
      expect(patch.ok()).toBeTruthy();
      expect(await patch.json()).toEqual({ success: true });

      const after = await page.request.get("/api/notifications/thanks");
      expect(after.ok()).toBeTruthy();
      const afterJson = (await after.json()) as ThankNotification[];

      expect(afterJson.every((n) => n.read === true)).toBeTruthy();
    });

    test("PATCH names mark-read sets read on like notifications", async ({
      page,
    }) => {
      await loginWithCredentials(page);

      const before = await page.request.get("/api/notifications/names");
      expect(before.ok()).toBeTruthy();
      const beforeJson = (await before.json()) as LikeNotification[];

      test.skip(
        beforeJson.length === 0,
        "No name notifications in test DB — run after like tests or re-seed",
      );

      const hasUnread = beforeJson.some((n) => n.read === false);
      expect(hasUnread).toBeTruthy();

      const patch = await page.request.patch(
        "/api/notifications/names/mark-read",
      );
      expect(patch.ok()).toBeTruthy();
      expect(await patch.json()).toEqual({ success: true });

      const after = await page.request.get("/api/notifications/names");
      expect(after.ok()).toBeTruthy();
      const afterJson = (await after.json()) as LikeNotification[];

      expect(afterJson.every((n) => n.read === true)).toBeTruthy();
    });

    test("PATCH descriptions mark-read sets read on like notifications", async ({
      page,
    }) => {
      await loginWithCredentials(page);

      const before = await page.request.get("/api/notifications/descriptions");
      expect(before.ok()).toBeTruthy();
      const beforeJson = (await before.json()) as LikeNotification[];

      test.skip(
        beforeJson.length === 0,
        "No description notifications in test DB — run after like tests or re-seed",
      );

      const hasUnread = beforeJson.some((n) => n.read === false);
      expect(hasUnread).toBeTruthy();

      const patch = await page.request.patch(
        "/api/notifications/descriptions/mark-read",
      );
      expect(patch.ok()).toBeTruthy();
      expect(await patch.json()).toEqual({ success: true });

      const after = await page.request.get("/api/notifications/descriptions");
      expect(after.ok()).toBeTruthy();
      const afterJson = (await after.json()) as LikeNotification[];

      expect(afterJson.every((n) => n.read === true)).toBeTruthy();
    });
  });
});
