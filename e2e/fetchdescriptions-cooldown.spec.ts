import { test, expect } from "@playwright/test";
import {
  applySeededDescriptionFilter,
  getDescriptionsTotalDocs,
  gotoFetchdescriptions,
  MIN_DESCRIPTIONS_FOR_PAGINATION_COOLDOWN,
  nextPageButton,
  openFiltersDrawer,
  sortSelect,
  triggerPaginationCooldown,
} from "./helpers/fetchdescriptions-ui";

test.describe("Fetchdescriptions cooldown UI", () => {
  test("sort change shows ~3s cooldown on dropdown", async ({ page }) => {
    await gotoFetchdescriptions(page);

    await sortSelect(page).selectOption("likedByCount,1");

    const sort = sortSelect(page);
    await expect(sort).toBeDisabled();
    await expect(sort.locator("option").first()).toContainText(
      /Please wait \d+ second/,
    );
  });

  test("filter apply shows ~5s cooldown in drawer", async ({ page }) => {
    await gotoFetchdescriptions(page);
    await applySeededDescriptionFilter(page);

    await openFiltersDrawer(page);
    const applyButton = page.getByRole("button", { name: /wait \d+ secs/i });
    await expect(applyButton).toBeVisible();
    await expect(applyButton).toBeDisabled();
  });

  test("pagination next at chunk edge shows ~15s cooldown", async ({
    page,
    request,
  }) => {
    const totalDocs = await getDescriptionsTotalDocs(request);
    expect(totalDocs).toBeGreaterThanOrEqual(
      MIN_DESCRIPTIONS_FOR_PAGINATION_COOLDOWN,
    );

    await gotoFetchdescriptions(page);

    await triggerPaginationCooldown(page);

    await expect(page.getByText(/Please wait 15 secs/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(nextPageButton(page)).toBeVisible();
  });
});
