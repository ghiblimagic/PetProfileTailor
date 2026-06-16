import { expect, type APIRequestContext } from "@playwright/test";

export async function submitSuggestion(
  request: APIRequestContext,
  {
    contentType,
    contentId,
    contentCreator,
    comments = "E2E suggestion comment with enough detail",
  }: {
    contentType: "names" | "descriptions";
    contentId: string;
    contentCreator: string;
    comments?: string;
  },
): Promise<void> {
  const response = await request.post("/api/suggestion", {
    data: {
      contentType,
      contentId,
      contentCreator,
      comments,
      tags: [],
      incorrectTags: [],
    },
  });

  if (response.status() === 400) {
    const json = (await response.json()) as { message?: string };
    if (
      json.message?.match(
        /cannot add a suggestion to this content again until the current suggestion is resolved/i,
      )
    ) {
      return;
    }
  }

  expect(response.ok()).toBeTruthy();
}

export async function expectSelfSuggestionRejected(
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
  const response = await request.post("/api/suggestion", {
    data: {
      contentType,
      contentId,
      contentCreator,
      comments: "E2E self-suggestion attempt",
    },
  });
  expect(response.status()).toBe(400);
  const json = (await response.json()) as { message?: string };
  expect(json.message).toMatch(/cannot add a suggestion to your own content/i);
}

export async function submitReport(
  request: APIRequestContext,
  {
    contentType,
    contentId,
    contentCreatedBy,
    contentCopy,
    reportCategories = ["Spam"],
  }: {
    contentType: "names" | "descriptions";
    contentId: string;
    contentCreatedBy: string;
    contentCopy: Record<string, unknown>;
    reportCategories?: string[];
  },
): Promise<void> {
  const response = await request.post("/api/flag/flagreportsubmission", {
    data: {
      contentType,
      contentId,
      contentCreatedBy,
      contentCopy,
      reportCategories,
      comments: "E2E report comment",
    },
  });

  if (response.status() === 400) {
    const json = (await response.json()) as { message?: string };
    if (
      json.message?.match(
        /cannot flag this content again until the review process is completed/i,
      )
    ) {
      return;
    }
  }

  expect(response.ok()).toBeTruthy();
}

export async function expectSelfReportRejected(
  request: APIRequestContext,
  {
    contentType,
    contentId,
    contentCreatedBy,
    contentCopy,
  }: {
    contentType: "names" | "descriptions";
    contentId: string;
    contentCreatedBy: string;
    contentCopy: Record<string, unknown>;
  },
): Promise<void> {
  const response = await request.post("/api/flag/flagreportsubmission", {
    data: {
      contentType,
      contentId,
      contentCreatedBy,
      contentCopy,
      reportCategories: ["Spam"],
    },
  });
  expect(response.status()).toBe(400);
  const json = (await response.json()) as { message?: string };
  expect(json.message).toMatch(/cannot flag your own content/i);
}
