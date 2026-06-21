import { test, expect } from "@playwright/test";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";
import {
  SEED_DESCRIPTION_ADMIN,
  SEED_DESCRIPTION_START,
  SEED_DESCRIPTION_START_PREFIX,
  SEED_NAME,
  SEED_NAME_ADMIN,
} from "./fixtures/seed-data";
import { lookupSeededDescription, lookupSeededName } from "./helpers/seed-lookup";
import {
  expectEditReportDialog,
  expectEditSuggestionDialog,
  expectReportSuccessToast,
  expectSuggestionSuccessToast,
  gotoDescriptionDetailForModeration,
  gotoNameDetailForModeration,
  listingMoreOptionsButton,
  moderationDialog,
  openListingMenuItem,
  submitReportDialog,
  submitSuggestionDialog,
} from "./helpers/moderation-ui";

test.describe("Moderation UI", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
    "PLAYWRIGHT_TEST and ADMIN credentials required",
  );

  test("user submits suggestion via listing menu on admin-owned name", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginWithCredentials(page);
    const seeded = await lookupSeededName(page.request, SEED_NAME_ADMIN);

    const pendingCheck = await page.request.get(
      `/api/suggestion?contentId=${seeded.id}&status=pending`,
    );
    const hasPending =
      pendingCheck.ok() &&
      Boolean(
        ((await pendingCheck.json()) as { suggestion?: unknown }).suggestion,
      );

    await gotoNameDetailForModeration(page, SEED_NAME_ADMIN);
    await openListingMenuItem(page, "Suggestion");

    if (hasPending) {
      await expectEditSuggestionDialog(page, () =>
        gotoNameDetailForModeration(page, SEED_NAME_ADMIN),
      );
      return;
    }

    const status = await submitSuggestionDialog(page);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);
    await expectSuggestionSuccessToast(page);
    await expect(moderationDialog(page)).toHaveCount(0);
  });

  test("user submits report via listing menu on admin-owned name", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginWithCredentials(page);
    const seeded = await lookupSeededName(page.request, SEED_NAME_ADMIN);

    const pendingCheck = await page.request.get(
      `/api/flag/getSpecificReport?contentId=${seeded.id}&status=pending`,
    );
    const hasPending = pendingCheck.ok();

    await gotoNameDetailForModeration(page, SEED_NAME_ADMIN);
    await openListingMenuItem(page, "Report");

    if (hasPending) {
      await expectEditReportDialog(page, () =>
        gotoNameDetailForModeration(page, SEED_NAME_ADMIN),
      );
      return;
    }

    const status = await submitReportDialog(page);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);
    await expectReportSuccessToast(page);
    await expect(moderationDialog(page)).toHaveCount(0);
  });

  test("content owner menu does not offer Suggestion or Report", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await gotoNameDetailForModeration(page, SEED_NAME);

    await listingMoreOptionsButton(page).click();

    await expect(
      page.getByRole("button", { name: "Suggestion" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Report" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("user submits suggestion via listing menu on admin-owned description", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginWithCredentials(page);
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_ADMIN,
    );

    const pendingCheck = await page.request.get(
      `/api/suggestion?contentId=${seeded.id}&status=pending`,
    );
    const hasPending =
      pendingCheck.ok() &&
      Boolean(
        ((await pendingCheck.json()) as { suggestion?: unknown }).suggestion,
      );

    await gotoDescriptionDetailForModeration(page, seeded.id);
    await openListingMenuItem(page, "Suggestion");

    if (hasPending) {
      await expectEditSuggestionDialog(page, () =>
        gotoDescriptionDetailForModeration(page, seeded.id),
      );
      return;
    }

    const status = await submitSuggestionDialog(page);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);
    await expectSuggestionSuccessToast(page);
    await expect(moderationDialog(page)).toHaveCount(0);
  });

  test("user submits report via listing menu on admin-owned description", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginWithCredentials(page);
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_ADMIN,
    );

    const pendingCheck = await page.request.get(
      `/api/flag/getSpecificReport?contentId=${seeded.id}&status=pending`,
    );
    const hasPending = pendingCheck.ok();

    await gotoDescriptionDetailForModeration(page, seeded.id);
    await openListingMenuItem(page, "Report");

    if (hasPending) {
      await expectEditReportDialog(page, () =>
        gotoDescriptionDetailForModeration(page, seeded.id),
      );
      return;
    }

    const status = await submitReportDialog(page);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);
    await expectReportSuccessToast(page);
    await expect(moderationDialog(page)).toHaveCount(0);
  });

  test("description owner menu does not offer Suggestion or Report", async ({
    page,
  }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );

    await loginWithCredentials(page);
    await gotoDescriptionDetailForModeration(page, seeded.id, {
      requireThankButton: false,
    });
    await expect(
      page.getByText(SEED_DESCRIPTION_START_PREFIX, { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    await listingMoreOptionsButton(page).click();

    await expect(
      page.getByRole("button", { name: "Suggestion" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Report" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });
});
