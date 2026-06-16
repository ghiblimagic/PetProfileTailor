import { expect, type APIRequestContext, type Page } from "@playwright/test";
import {
  MIN_LISTING_DOCS_FOR_PAGINATION_COOLDOWN,
  SEED_DESCRIPTION_FILTER_CATEGORY,
  SEED_DESCRIPTION_FILTER_TAG,
} from "../fixtures/seed-data";

export const MIN_DESCRIPTIONS_FOR_PAGINATION_COOLDOWN =
  MIN_LISTING_DOCS_FOR_PAGINATION_COOLDOWN;

export { SEED_DESCRIPTION_FILTER_CATEGORY, SEED_DESCRIPTION_FILTER_TAG };

export async function getDescriptionsTotalDocs(
  request: APIRequestContext,
): Promise<number> {
  const response = await request.get(
    "/api/description/swr?page=1&sortingproperty=likedByCount&sortingvalue=-1",
  );
  if (!response.ok()) return 0;
  const json = (await response.json()) as { totalDocs?: number };
  return json.totalDocs ?? 0;
}

export async function gotoFetchdescriptions(page: Page): Promise<void> {
  const firstChunk = page.waitForResponse(
    (response) =>
      response.url().includes("/api/description/swr") &&
      response.url().includes("page=1"),
  );
  await page.goto("/fetchdescriptions");
  await firstChunk;
  await expect(page.getByText(/\d+-\d+ of \d+ Items/)).toBeVisible({
    timeout: 20_000,
  });
}

/** Click next one page before the loaded-chunk edge (page 3 when 5 pages are loaded). */
export async function triggerPaginationCooldown(page: Page): Promise<void> {
  await page.getByRole("button", { name: "3", exact: true }).click();
  await nextPageButton(page).click();
}

export function sortSelect(page: Page) {
  return page.locator("select").nth(1);
}

export function nextPageButton(page: Page) {
  return page.getByRole("button", { name: "nextpage" });
}

export async function openFiltersDrawer(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Open Filters" }).click();
  await expect(page.getByRole("heading", { name: "Filters" })).toBeVisible({
    timeout: 10_000,
  });
}

export async function applySeededDescriptionFilter(page: Page): Promise<void> {
  await openFiltersDrawer(page);
  await page
    .getByRole("button", { name: SEED_DESCRIPTION_FILTER_CATEGORY, exact: true })
    .click();
  await page.getByText(SEED_DESCRIPTION_FILTER_TAG, { exact: true }).click();
  await page.getByRole("button", { name: "apply", exact: true }).click();
}
