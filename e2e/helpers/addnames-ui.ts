import { expect, type Page } from "@playwright/test";
import {
  SEED_NAME_TAG_ATTACH_CATEGORY,
  SEED_NAME_TAG_FOR_ADD_NAMES,
} from "../fixtures/seed-data";

export { SEED_NAME_TAG_ATTACH_CATEGORY, SEED_NAME_TAG_FOR_ADD_NAMES };

export async function openNameTagsCheatSheet(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Open", exact: true })
    .click();
}

export async function selectNameTagInCheatSheet(
  page: Page,
  categoryLabel: string,
  tagLabel: string,
): Promise<void> {
  await page
    .getByRole("button", { name: categoryLabel, exact: true })
    .click();
  await page.getByText(tagLabel, { exact: true }).click();
}

export async function submitNameWithTags(
  page: Page,
  name: string,
  options: {
    categoryLabel?: string;
    tagLabel?: string;
  } = {},
): Promise<number> {
  const categoryLabel =
    options.categoryLabel ?? SEED_NAME_TAG_ATTACH_CATEGORY;
  const tagLabel = options.tagLabel ?? SEED_NAME_TAG_FOR_ADD_NAMES;

  await page.locator("#nameInput").fill(name);
  await openNameTagsCheatSheet(page);
  await selectNameTagInCheatSheet(page, categoryLabel, tagLabel);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/names") &&
      response.request().method() === "POST" &&
      !response.url().includes("check-if-content-exists"),
  );

  await page.getByRole("button", { name: "Add name" }).click();
  const response = await responsePromise;
  return response.status();
}

export function hashedTagText(tag: string): string {
  return `#${tag}`;
}

export async function clickNameExistsSearch(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Search" })
    .filter({ has: page.locator("svg") })
    .click();
}

export async function submitNameForDuplicateCheck(
  page: Page,
  name: string,
): Promise<void> {
  await page.locator("#nameInput").fill(name);
  await page.getByRole("button", { name: "Add name" }).click();
}
