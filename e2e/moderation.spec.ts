import { test, expect } from "@playwright/test";
import {
  getPlaywrightAdminCredentials,
  getPlaywrightCredentials,
  loginWithAdminCredentials,
  loginWithCredentials,
} from "./helpers/auth";
import {
  expectSelfReportRejected,
  expectSelfSuggestionRejected,
  submitReport,
  submitSuggestion,
} from "./helpers/moderation";
import {
  SEED_DESCRIPTION_ADMIN,
  SEED_DESCRIPTION_START,
  SEED_NAME,
  SEED_NAME_ADMIN,
} from "./fixtures/seed-data";
import {
  lookupSeededDescription,
  lookupSeededName,
} from "./helpers/seed-lookup";

test.describe("Moderation API", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !getPlaywrightCredentials() || !getPlaywrightAdminCredentials(),
    "PLAYWRIGHT_TEST and ADMIN credentials required",
  );

  test("admin can submit suggestion on user name", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);

    await loginWithAdminCredentials(page);
    await submitSuggestion(page.request, {
      contentType: "names",
      contentId: seeded.id,
      contentCreator: seeded.creatorId,
    });
  });

  test("self-suggestion is rejected", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME);

    await loginWithCredentials(page);
    await expectSelfSuggestionRejected(page.request, {
      contentType: "names",
      contentId: seeded.id,
      contentCreator: seeded.creatorId,
    });
  });

  test("user can submit report on admin-owned name", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME_ADMIN);

    await loginWithCredentials(page);
    await submitReport(page.request, {
      contentType: "names",
      contentId: seeded.id,
      contentCreatedBy: seeded.creatorId,
      contentCopy: { content: SEED_NAME_ADMIN },
    });
  });

  test("self-report is rejected", async ({ page }) => {
    const seeded = await lookupSeededName(page.request, SEED_NAME_ADMIN);

    await loginWithAdminCredentials(page);
    await expectSelfReportRejected(page.request, {
      contentType: "names",
      contentId: seeded.id,
      contentCreatedBy: seeded.creatorId,
      contentCopy: { content: SEED_NAME_ADMIN },
    });
  });

  test("unauthenticated suggestion POST returns 401", async ({ page }) => {
    const nameSeeded = await lookupSeededName(page.request, SEED_NAME);
    const descriptionSeeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );

    for (const { contentType, seeded } of [
      { contentType: "names" as const, seeded: nameSeeded },
      { contentType: "descriptions" as const, seeded: descriptionSeeded },
    ]) {
      const response = await page.request.post("/api/suggestion", {
        data: {
          contentType,
          contentId: seeded.id,
          contentCreator: seeded.creatorId,
          comments: "Should fail",
        },
      });

      expect(response.status()).toBe(401);
    }
  });

  test("unauthenticated report POST returns 401", async ({ page }) => {
    const nameSeeded = await lookupSeededName(page.request, SEED_NAME_ADMIN);
    const descriptionSeeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_ADMIN,
    );

    for (const { contentType, seeded, content } of [
      {
        contentType: "names" as const,
        seeded: nameSeeded,
        content: SEED_NAME_ADMIN,
      },
      {
        contentType: "descriptions" as const,
        seeded: descriptionSeeded,
        content: SEED_DESCRIPTION_ADMIN,
      },
    ]) {
      const response = await page.request.post("/api/flag/flagreportsubmission", {
        data: {
          contentType,
          contentId: seeded.id,
          contentCreatedBy: seeded.creatorId,
          contentCopy: { content },
          reportCategories: ["Spam"],
        },
      });

      expect(response.status()).toBe(401);
    }
  });

  test("admin can submit suggestion on user description", async ({ page }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );

    await loginWithAdminCredentials(page);
    await submitSuggestion(page.request, {
      contentType: "descriptions",
      contentId: seeded.id,
      contentCreator: seeded.creatorId,
    });
  });

  test("self-suggestion on own description is rejected", async ({ page }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_START,
    );

    await loginWithCredentials(page);
    await expectSelfSuggestionRejected(page.request, {
      contentType: "descriptions",
      contentId: seeded.id,
      contentCreator: seeded.creatorId,
    });
  });

  test("user can submit report on admin-owned description", async ({ page }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_ADMIN,
    );

    await loginWithCredentials(page);
    await submitReport(page.request, {
      contentType: "descriptions",
      contentId: seeded.id,
      contentCreatedBy: seeded.creatorId,
      contentCopy: { content: SEED_DESCRIPTION_ADMIN },
    });
  });

  test("self-report on own admin description is rejected", async ({ page }) => {
    const seeded = await lookupSeededDescription(
      page.request,
      SEED_DESCRIPTION_ADMIN,
    );

    await loginWithAdminCredentials(page);
    await expectSelfReportRejected(page.request, {
      contentType: "descriptions",
      contentId: seeded.id,
      contentCreatedBy: seeded.creatorId,
      contentCopy: { content: SEED_DESCRIPTION_ADMIN },
    });
  });
});
