import { test, expect } from "@playwright/test";
import {
  getPlaywrightCredentials,
  loginWithCredentials,
} from "./helpers/auth";
import { getPlaywrightProfileName } from "./helpers/register";
import { lookupUserByProfileName } from "./helpers/seed-lookup";
import {
  fillProfileBio,
  fillProfileLocation,
  openProfileBioEdit,
  profileBioModal,
  saveProfileBioEdit,
} from "./helpers/profile";

test.describe("Profile bio happy path", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("API saves bio and persists on profile lookup", async ({ page }) => {
    const profileName = getPlaywrightProfileName();
    const bio = `E2E bio API ${Date.now().toString(36)}`;

    const response = await page.request.put("/api/user/editbiolocationavatar", {
      data: {
        bioSubmission: {
          bio,
          location: "",
        },
      },
    });
    expect(response.ok()).toBeTruthy();

    const user = await lookupUserByProfileName(page.request, profileName);
    expect(user.bio).toBe(bio);
  });

  test("UI saves bio and shows it on profile page", async ({ page }) => {
    const profileName = getPlaywrightProfileName();
    const bio = `E2E bio UI ${Date.now().toString(36)}`;

    await page.goto(`/profile/${profileName}`);
    await openProfileBioEdit(page);
    await fillProfileBio(page, bio);
    await saveProfileBioEdit(page, { expectOk: true });

    await expect(
      page.getByText(/profile successfully updated/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(profileBioModal(page)).toHaveCount(0);
    await expect(page.getByText(bio)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Profile location", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("API saves location and persists on profile lookup", async ({ page }) => {
    const profileName = getPlaywrightProfileName();
    const existing = await lookupUserByProfileName(page.request, profileName);
    const location = `E2E location ${Date.now().toString(36)}`;
    const bio = existing.bio ?? `E2E bio ${Date.now().toString(36)}`;

    const response = await page.request.put("/api/user/editbiolocationavatar", {
      data: {
        bioSubmission: {
          bio,
          location,
        },
      },
    });
    expect(response.ok()).toBeTruthy();

    const user = await lookupUserByProfileName(page.request, profileName);
    expect(user.location).toBe(location);
  });

  test("UI saves location and shows it on profile page", async ({ page }) => {
    const profileName = getPlaywrightProfileName();
    const location = `E2E location UI ${Date.now().toString(36)}`;

    await page.goto(`/profile/${profileName}`);
    await openProfileBioEdit(page);
    await fillProfileLocation(page, location);
    await saveProfileBioEdit(page, { expectOk: true });

    await expect(
      page.getByText(/profile successfully updated/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(profileBioModal(page)).toHaveCount(0);
    await expect(page.getByText(location)).toBeVisible({ timeout: 15_000 });
  });
});

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

test.describe("Profile location blocklist", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getPlaywrightCredentials(), "PLAYWRIGHT_TEST_EMAIL/PASSWORD not set");
    await loginWithCredentials(page);
  });

  test("API rejects blocklisted location with blockedBy", async ({ page }) => {
    const profileName = getPlaywrightProfileName();
    const existing = await lookupUserByProfileName(page.request, profileName);

    const response = await page.request.put("/api/user/editbiolocationavatar", {
      data: {
        bioSubmission: {
          bio: existing.bio ?? "Pet lover",
          location: "Somewhere wank suburb",
        },
      },
    });

    expect(response.status()).toBe(403);
    const body = (await response.json()) as {
      message: string;
      blockedBy: string;
    };
    expect(body.blockedBy).toBe("wank");
    expect(body.message).toMatch(/location/i);
  });

  test("UI rejects blocklisted location on profile edit", async ({ page }) => {
    const profileName = getPlaywrightProfileName();
    await page.goto(`/profile/${profileName}`);

    await openProfileBioEdit(page);
    await fillProfileLocation(page, "Somewhere wank suburb");
    await saveProfileBioEdit(page);

    await expect(
      page.getByRole("alert").filter({ hasText: /wank|not allowed|blocklist/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
