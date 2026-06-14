import { expect, type APIRequestContext } from "@playwright/test";

const DEFAULT_THANK_MESSAGE = "Made me smile or laugh";

export async function submitThanks(
  request: APIRequestContext,
  {
    contentType,
    contentId,
    contentCreator,
    messages = [DEFAULT_THANK_MESSAGE],
  }: {
    contentType: "names" | "descriptions";
    contentId: string;
    contentCreator: string;
    messages?: string[];
  },
): Promise<void> {
  const response = await request.post("/api/thanks", {
    data: {
      contentType,
      contentId,
      contentCreator,
      messages,
    },
  });
  expect(response.ok()).toBeTruthy();
}

export async function expectSelfThankRejected(
  request: APIRequestContext,
  {
    contentType,
    contentId,
    contentCreator,
  }: {
    contentType: "names" | "descriptions";
    contentId: string;
    contentCreator: string;
  },
): Promise<void> {
  const response = await request.post("/api/thanks", {
    data: {
      contentType,
      contentId,
      contentCreator,
      messages: [DEFAULT_THANK_MESSAGE],
    },
  });
  expect(response.status()).toBe(400);
  const json = (await response.json()) as { message?: string };
  expect(json.message).toMatch(/cannot add a thank you note to your own content/i);
}
