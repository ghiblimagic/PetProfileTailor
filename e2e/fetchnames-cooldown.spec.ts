import { test, expect } from "@playwright/test";
import {
  getNamesTotalDocs,
  gotoFetchnames,
  MIN_NAMES_FOR_PAGINATION_COOLDOWN,
  nextPageButton,
  openFiltersDrawer,
  sortSelect,
} from "./helpers/fetchnames-ui";

test.describe("Fetchnames cooldown UI", () => {
  test("sort change shows ~3s cooldown on dropdown", async ({ page }) => {
    await gotoFetchnames(page);

    await sortSelect(page).selectOption("likedByCount,1");

    const sort = sortSelect(page);
    await expect(sort).toBeDisabled();
    await expect(sort.locator("option").first()).toContainText(
      /Please wait \d+ second/,
    );
  });

  test("filter apply shows ~5s cooldown in drawer", async ({ page }) => {
    await gotoFetchnames(page);

    await openFiltersDrawer(page);
    await page.getByRole("button", { name: "Human Names" }).click();

    await openFiltersDrawer(page);
    await expect(page.getByText(/Wait \d+s/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Human Names" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /wait \d+ secs/i }),
    ).toBeDisabled();
  });

  test("pagination next at chunk edge shows ~15s cooldown", async ({
    page,
    request,
  }) => {
    const totalDocs = await getNamesTotalDocs(request);
    test.skip(
      totalDocs < MIN_NAMES_FOR_PAGINATION_COOLDOWN,
      `Need ${MIN_NAMES_FOR_PAGINATION_COOLDOWN}+ names in test DB (have ${totalDocs})`,
    );

    await gotoFetchnames(page);

    // With default 10/page and 50-item first chunk: page 4 + next triggers preload.
    await page.getByRole("button", { name: "4", exact: true }).click();
    await nextPageButton(page).click();

    await expect(page.getByText(/Please wait 15 secs/)).toBeVisible();
    await expect(nextPageButton(page)).toBeVisible();
  });
});
