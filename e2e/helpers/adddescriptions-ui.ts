import { type Page } from "@playwright/test";
import {
  SEED_DESCRIPTION_FILTER_CATEGORY,
  SEED_DESCRIPTION_FILTER_TAG,
} from "../fixtures/seed-data";
import { fillDescriptionContent, submitDescriptionForm } from "./descriptions";

export { SEED_DESCRIPTION_FILTER_CATEGORY, SEED_DESCRIPTION_FILTER_TAG };

export async function openDescriptionTagsCheatSheet(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Open", exact: true }).click();
}

export async function selectDescriptionTagInCheatSheet(
  page: Page,
  categoryLabel: string,
  tagLabel: string,
): Promise<void> {
  await page.getByRole("button", { name: categoryLabel, exact: true }).click();
  await page.getByText(tagLabel, { exact: true }).click();
}

export function hashedTagText(tag: string): string {
  return `#${tag}`;
}

export async function submitDescriptionWithTags(
  page: Page,
  content: string,
  options: {
    categoryLabel?: string;
    tagLabel?: string;
  } = {},
): Promise<{ status: number; id: string }> {
  const categoryLabel =
    options.categoryLabel ?? SEED_DESCRIPTION_FILTER_CATEGORY;
  const tagLabel = options.tagLabel ?? SEED_DESCRIPTION_FILTER_TAG;

  await fillDescriptionContent(page, content);
  await openDescriptionTagsCheatSheet(page);
  await selectDescriptionTagInCheatSheet(page, categoryLabel, tagLabel);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/description") &&
      response.request().method() === "POST" &&
      !response.url().includes("check-if-content-exists"),
  );

  await submitDescriptionForm(page);
  const response = await responsePromise;
  const body = (await response.json()) as { _id: string };
  return { status: response.status(), id: body._id };
}
