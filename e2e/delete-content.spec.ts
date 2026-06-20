import { test, expect } from "@playwright/test";
import { getPlaywrightCredentials, loginWithCredentials } from "./helpers/auth";
import {
  createUniqueNameViaUi,
  createUniqueDescriptionViaUi,
  deleteOwnedContentFromDetailPage,
} from "./helpers/delete-content-ui";
import { gotoNameDetail } from "./helpers/thanks-ui";

test.describe("Owner delete content", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("owner deletes own name from detail page", async ({ page }) => {
    test.setTimeout(60_000);

    const uniqueName = `E2EDel${Date.now().toString(36)}`;

    await createUniqueNameViaUi(page, uniqueName);
    await gotoNameDetail(page, uniqueName);
    await deleteOwnedContentFromDetailPage(page);

    await expect(page.getByText("DELETED", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    const checkResponse = await page.request.get(
      `/api/names/check-if-content-exists/${encodeURIComponent(uniqueName)}`,
    );
    const checkJson = (await checkResponse.json()) as { type?: string };
    expect(checkJson.type).not.toBe("duplicate");
  });

  test("owner deletes own description from detail page", async ({ page }) => {
    test.setTimeout(60_000);

    const uniqueContent = `E2E delete description ${Date.now().toString(36)} with enough length`;

    const { id, content } = await createUniqueDescriptionViaUi(
      page,
      uniqueContent,
    );

    await page.goto(`/description/${id}`);
    await deleteOwnedContentFromDetailPage(page);

    await expect(page.getByText("DELETED", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    const checkResponse = await page.request.get(
      `/api/description/check-if-content-exists/${encodeURIComponent(content)}`,
    );
    const checkJson = (await checkResponse.json()) as { type?: string };
    expect(checkJson.type).not.toBe("duplicate");
  });
});
