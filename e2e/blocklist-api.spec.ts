import { test, expect } from "@playwright/test";
import { getPlaywrightCredentials, loginWithCredentials } from "./helpers/auth";

test.describe("Content blocklist API", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("POST /api/names returns blockedBy for exact blocklisted name", async ({
    page,
  }) => {
    const response = await page.request.post("/api/names", {
      data: { content: "butt" },
    });

    expect(response.status()).toBe(403);
    const body = (await response.json()) as {
      message: string;
      blockedBy: string;
    };
    expect(body.blockedBy).toBe("butt");
    expect(body.message).toMatch(/content/i);
  });

  test("POST /api/description returns blockedBy for blocklisted substring", async ({
    page,
  }) => {
    const response = await page.request.post("/api/description", {
      data: {
        content:
          "This friendly dog wank test phrase is long enough for validation",
      },
    });

    expect(response.status()).toBe(403);
    const body = (await response.json()) as {
      message: string;
      blockedBy: string;
    };
    expect(body.blockedBy).toBe("wank");
    expect(body.message).toMatch(/content/i);
  });
});
