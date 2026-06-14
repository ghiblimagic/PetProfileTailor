import { test, expect } from "@playwright/test";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightCredentials,
  loginWithAdminCredentials,
  loginWithCredentials,
  signOutViaNav,
} from "./helpers/auth";
import {
  getPlaywrightAdminDisplayName,
  SEED_DESCRIPTION_START,
  SEED_NAME,
} from "./fixtures/seed-data";
import {
  gotoNotificationsPage,
  leaveThanksTabBeforeMarkRead,
  openThanksTab,
  thanksUnreadBadge,
} from "./helpers/notifications-ui";
import {
  lookupSeededDescription,
  lookupSeededName,
} from "./helpers/seed-lookup";
import { submitThanks } from "./helpers/thanks";

const DEFAULT_THANK_MESSAGE = "Made me smile or laugh";
const TRUNCATED_DESCRIPTION =
  SEED_DESCRIPTION_START.slice(0, 60) +
  (SEED_DESCRIPTION_START.length > 60 ? "..." : "");

test.describe("Notifications UI", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
    "PLAYWRIGHT_TEST and ADMIN credentials required",
  );

  test("thanks tab renders populated name thank row", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);

    await loginWithAdminCredentials(page);
    await submitThanks(page.request, {
      contentType: "names",
      contentId: seeded.id,
      contentCreator: seeded.creatorId,
    });

    await signOutViaNav(page);
    await loginWithCredentials(page);
    await gotoNotificationsPage(page);
    await openThanksTab(page);

    const row = page
      .locator("div")
      .filter({ hasText: /thanked you/i })
      .filter({ hasText: SEED_NAME });

    await expect(row.getByText(getPlaywrightAdminDisplayName())).toBeVisible({
      timeout: 15_000,
    });
    await expect(row.getByText(DEFAULT_THANK_MESSAGE)).toBeVisible();

    await leaveThanksTabBeforeMarkRead(page);
  });

  test("thanks tab mark-read clears unread badge after tab stays open", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await loginWithCredentials(page);
    await gotoNotificationsPage(page);

    const badge = thanksUnreadBadge(page);
    await expect(badge).toBeVisible({ timeout: 15_000 });

    await openThanksTab(page);
    await expect(page.getByText(SEED_NAME)).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(async () => badge.count(), { timeout: 12_000 })
      .toBe(0);
  });

  test("thanks tab renders populated description thank row", async ({
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
    await gotoNotificationsPage(page);
    await openThanksTab(page);

    const row = page
      .locator("div")
      .filter({ hasText: /thanked you/i })
      .filter({ hasText: TRUNCATED_DESCRIPTION });

    await expect(row.getByText(getPlaywrightAdminDisplayName())).toBeVisible({
      timeout: 15_000,
    });
    await expect(row.getByText(DEFAULT_THANK_MESSAGE)).toBeVisible();
  });
});
