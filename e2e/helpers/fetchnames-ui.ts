import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { MIN_LISTING_DOCS_FOR_PAGINATION_COOLDOWN } from "../fixtures/seed-data";

/** Minimum names in DB to trigger SWR chunk preload + 15s pagination cooldown. */
export const MIN_NAMES_FOR_PAGINATION_COOLDOWN =
  MIN_LISTING_DOCS_FOR_PAGINATION_COOLDOWN;

export async function getNamesTotalDocs(
  request: APIRequestContext
): Promise<number> {
  const response = await request.get(
    "/api/names/swr?page=1&sortingproperty=likedByCount&sortingvalue=-1"
  );
  if (!response.ok()) return 0;
  const json = (await response.json()) as { totalDocs?: number };
  return json.totalDocs ?? 0;
}

export async function gotoFetchnames(page: Page): Promise<void> {
  const firstChunk = page.waitForResponse(
    (response) =>
      response.url().includes("/api/names/swr") &&
      response.url().includes("page=1")
  );
  await page.goto("/fetchnames");
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

export function perPageSelect(page: Page) {
  return page.locator("select").first();
}

export function sortSelect(page: Page) {
  return page.locator("select").nth(1);
}

export function nextPageButton(page: Page) {
  return page.getByRole("button", { name: "nextpage" });
}

export async function openFiltersDrawer(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(page.getByRole("heading", { name: "Filters" })).toBeVisible({
    timeout: 10_000,
  });
}
