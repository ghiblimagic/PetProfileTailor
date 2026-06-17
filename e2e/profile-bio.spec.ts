import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";
import { getPlaywrightProfileName } from "./helpers/register";
import {
  fillProfileBio,
  openProfileBioEdit,
  saveProfileBioEdit,
} from "./helpers/profile";

test.describe("Profile bio blocklist", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("API rejects blocklisted bio with blockedBy", async ({ page }) => {
    const response = await page.request.put("/api/user/editbiolocationavatar", {
      data: {
        bioSubmission: {
          bio: "My friendly bio wank test phrase here",
          location: "",
        },
      },
    });

    expect(response.status()).toBe(403);
    const body = (await response.json()) as {
      message: string;
      blockedBy: string;
    };
    expect(body.blockedBy).toBe("wank");
    expect(body.message).toMatch(/bio/i);
  });

  test("UI rejects blocklisted bio on profile edit", async ({ page }) => {
    const profileName = getPlaywrightProfileName();
    await page.goto(`/profile/${profileName}`);

    await openProfileBioEdit(page);
    await fillProfileBio(page, "Pet lover wank bio test content");
    await saveProfileBioEdit(page);

    await expect(
      page.getByRole("alert").filter({ hasText: /wank|not allowed|blocklist/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
