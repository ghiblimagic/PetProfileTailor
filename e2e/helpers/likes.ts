import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

/** Must match `E2E_STRICT_LIKE_RATE_LIMIT_HEADER` in likeToggleRateLimit.ts */
const E2E_STRICT_LIKE_RATE_LIMIT_HEADER = "x-e2e-strict-like-rate-limit";

type ContentCreator = {
  _id: string;
  name?: string;
  profileName?: string;
  profileImage?: string;
};

type UserLikesApiResponse = {
  names: Array<{ contentId: string }>;
};

async function isNameLikedBySession(
  request: APIRequestContext,
  contentId: string,
): Promise<boolean> {
  const response = await request.get("/api/user/likes");
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as UserLikesApiResponse;
  return json.names.some((entry) => entry.contentId === contentId);
}

/** Toggle until the name is liked (idempotent across test runs). */
export async function ensureNameLiked(
  request: APIRequestContext,
  contentId: string,
  contentCreator: ContentCreator,
): Promise<void> {
  if (await isNameLikedBySession(request, contentId)) return;

  const url = `/api/names/likes/${contentId}/togglelike`;
  const body = { contentCreator };

  const response = await request.post(url, { data: body });
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as { liked: boolean };
  expect(json.liked).toBe(true);
}

/** Toggle until the name is not liked by the current session (idempotent). */
export async function ensureNameUnliked(
  request: APIRequestContext,
  contentId: string,
  contentCreator: ContentCreator,
): Promise<void> {
  if (!(await isNameLikedBySession(request, contentId))) return;

  const url = `/api/names/likes/${contentId}/togglelike`;
  const body = { contentCreator };

  const response = await request.post(url, { data: body });
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as { liked: boolean };
  expect(json.liked).toBe(false);
}

/** E2E only — reset server like-toggle rate limit counter for the current session. */
export async function resetLikeToggleRateLimitForSession(
  request: APIRequestContext,
): Promise<void> {
  const response = await request.post(
    "/api/test/e2e/reset-like-toggle-rate-limit",
  );
  expect(response.ok()).toBeTruthy();
}

type ToggleLikeResponseBody = {
  liked?: boolean;
  message?: string;
  retryAfterSeconds?: number;
};

/**
 * POST togglelike with production rate limit (3 / 2 min) even in E2E server mode.
 * Used to verify 429 behavior on the real route.
 */
export async function postNameToggleLikeWithProductionRateLimit(
  request: APIRequestContext,
  contentId: string,
  contentCreator: ContentCreator,
): Promise<{ status: number; body: ToggleLikeResponseBody }> {
  const url = `/api/names/likes/${contentId}/togglelike`;
  const response = await request.post(url, {
    data: { contentCreator },
    headers: { [E2E_STRICT_LIKE_RATE_LIMIT_HEADER]: "1" },
  });
  const body = (await response.json()) as ToggleLikeResponseBody;
  return { status: response.status(), body };
}

/** Like / unlike heart on a name detail page (`ContentListing` standalone). */
export function nameDetailLikeButton(page: Page) {
  return page.getByRole("button", { name: /^(Like|Unlike)$/ });
}

/**
 * Two clicks back-to-back (within the 500ms debounce window).
 * Playwright `dblclick()` can use the OS double-click interval (~500ms), which fires two debounced commits.
 */
export async function rapidDoubleClick(
  page: Page,
  locator: Locator,
): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.click(x, y);
  await page.mouse.click(x, y);
}

/**
 * Like then unlike within the 500ms debounce window (uses mouse clicks, not `dblclick()`).
 */
export async function likeThenUnlikeWithinDebounce(
  page: Page,
  locator: Locator,
  pauseMs = 150,
): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.click(x, y);
  if (pauseMs > 0) {
    await page.waitForTimeout(pauseMs);
  }
  await page.mouse.click(x, y);
}

async function isDescriptionLikedBySession(
  request: APIRequestContext,
  contentId: string,
): Promise<boolean> {
  const response = await request.get("/api/user/likes");
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as {
    descriptions: Array<{ contentId: string }>;
  };
  return json.descriptions.some((entry) => entry.contentId === contentId);
}

/** Toggle until the description is liked (idempotent across test runs). */
export async function ensureDescriptionLiked(
  request: APIRequestContext,
  contentId: string,
  contentCreator: ContentCreator,
): Promise<void> {
  if (await isDescriptionLikedBySession(request, contentId)) return;

  const url = `/api/description/likes/${contentId}/togglelike`;
  const body = { contentCreator };

  const response = await request.post(url, { data: body });
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as { liked: boolean };
  expect(json.liked).toBe(true);
}
