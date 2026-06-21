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
  contentThankButton,
  DEFAULT_THANK_MESSAGE,
  expectThanksDialogSubmitted,
  gotoDescriptionDetail,
  gotoNameDetail,
  openThanksDialog,
  submitThanksDialog,
} from "./helpers/thanks-ui";
import {
  gotoNotificationsPage,
  leaveThanksTabBeforeMarkRead,
  notificationRow,
  openThanksTab,
} from "./helpers/notifications-ui";
import {
  lookupSeededDescription,
  lookupSeededName,
} from "./helpers/seed-lookup";
import { resetE2eThanksForContent } from "./helpers/thanks";

const TRUNCATED_DESCRIPTION =
  SEED_DESCRIPTION_START.slice(0, 60) +
  (SEED_DESCRIPTION_START.length > 60 ? "..." : "");

test.describe("Thanks UI", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
    "PLAYWRIGHT_TEST and ADMIN credentials required",
  );

  test.beforeAll(async ({ request }) => {
    const seeded = await lookupSeededName(request, SEED_NAME);
    await resetE2eThanksForContent(request, {
      contentType: "names",
      contentId: seeded.id,
    });
  });

  test("name detail — admin submits thank via dialog", async ({ page }) => {
    test.setTimeout(60_000);

    await loginWithAdminCredentials(page);
    await gotoNameDetail(page, SEED_NAME);
    await openThanksDialog(page);

    const result = await submitThanksDialog(page);
    await expectThanksDialogSubmitted(page, result);
  });

  test("notifications — content owner sees UI-submitted name thank", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await gotoNotificationsPage(page);
    await openThanksTab(page);

    const row = notificationRow(page, /thanked you/i, SEED_NAME).first();

    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText(getPlaywrightAdminDisplayName());
    await expect(row).toContainText(DEFAULT_THANK_MESSAGE);

    await leaveThanksTabBeforeMarkRead(page);
  });

  test("name detail — content owner does not see Thank button", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await gotoNameDetail(page, SEED_NAME);
    await expect(contentThankButton(page)).toHaveCount(0);
  });

  test("description detail — admin submits thank via dialog", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );

    await resetE2eThanksForContent(page.request, {
      contentType: "descriptions",
      contentId: seeded.id,
    });

    await loginWithAdminCredentials(page);
    await gotoDescriptionDetail(page, seeded.id);
    await openThanksDialog(page);

    const result = await submitThanksDialog(page, ["Clever!"]);
    await expectThanksDialogSubmitted(page, result);

    await signOutViaNav(page);
    await loginWithCredentials(page);
    await gotoNotificationsPage(page);
    await openThanksTab(page);

    const row = notificationRow(
      page,
      /thanked you/i,
      TRUNCATED_DESCRIPTION,
    ).first();

    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText(getPlaywrightAdminDisplayName());
    await expect(row).toContainText("Clever!");

    await leaveThanksTabBeforeMarkRead(page);
  });
});
