import { expect, type APIRequestContext } from "@playwright/test";

type ContentCreator = {
  _id: string;
  name?: string;
  profileName?: string;
  profileImage?: string;
};

/** Toggle until the name is liked (idempotent across test runs). */
export async function ensureNameLiked(
  request: APIRequestContext,
  contentId: string,
  contentCreator: ContentCreator,
): Promise<void> {
  const url = `/api/names/likes/${contentId}/togglelike`;
  const body = { contentCreator };

  const first = await request.post(url, { data: body });
  expect(first.ok()).toBeTruthy();
  const firstJson = (await first.json()) as { liked: boolean };

  if (firstJson.liked) return;

  const second = await request.post(url, { data: body });
  expect(second.ok()).toBeTruthy();
  const secondJson = (await second.json()) as { liked: boolean };
  expect(secondJson.liked).toBe(true);
}

/** Toggle until the description is liked (idempotent across test runs). */
export async function ensureDescriptionLiked(
  request: APIRequestContext,
  contentId: string,
  contentCreator: ContentCreator,
): Promise<void> {
  const url = `/api/description/likes/${contentId}/togglelike`;
  const body = { contentCreator };

  const first = await request.post(url, { data: body });
  expect(first.ok()).toBeTruthy();
  const firstJson = (await first.json()) as { liked: boolean };

  if (firstJson.liked) return;

  const second = await request.post(url, { data: body });
  expect(second.ok()).toBeTruthy();
  const secondJson = (await second.json()) as { liked: boolean };
  expect(secondJson.liked).toBe(true);
}
