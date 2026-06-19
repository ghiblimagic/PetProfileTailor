import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";

type SessionRefreshResponse = {
  id: string;
  name: string;
  profileName: string;
  profileImage: string;
  bio: string;
  location: string;
};

test.describe("POST /api/auth/session/refresh", () => {
  test("unauthenticated request returns 401", async ({ request }) => {
    const response = await request.post("/api/auth/session/refresh");
    expect(response.status()).toBe(401);
  });

  test.describe("authenticated", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(
        !getPlaywrightCredentials(),
        "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set",
      );
      await loginWithCredentials(page);
    });

    test("returns updated bio after profile bio save", async ({ page }) => {
      const bio = `E2E refresh bio ${Date.now().toString(36)}`;

      const saveResponse = await page.request.put(
        "/api/user/editbiolocationavatar",
        {
          data: {
            bioSubmission: {
              bio,
              location: "",
            },
          },
        },
      );
      expect(saveResponse.ok()).toBeTruthy();

      const refreshResponse = await page.request.post(
        "/api/auth/session/refresh",
      );
      expect(refreshResponse.ok()).toBeTruthy();

      const body = (await refreshResponse.json()) as SessionRefreshResponse;
      expect(body.bio).toBe(bio);
    });

    test("returns updated name after settings save", async ({ page }) => {
      const creds = getPlaywrightCredentials()!;
      const updatedName = `E2E Refresh ${Date.now().toString(36)}`;

      const saveResponse = await page.request.put("/api/auth/update", {
        data: {
          name: updatedName,
          email: creds.email,
        },
      });
      expect(saveResponse.ok()).toBeTruthy();

      const refreshResponse = await page.request.post(
        "/api/auth/session/refresh",
      );
      expect(refreshResponse.ok()).toBeTruthy();

      const body = (await refreshResponse.json()) as SessionRefreshResponse;
      expect(body.name).toBe(updatedName);
    });
  });
});
