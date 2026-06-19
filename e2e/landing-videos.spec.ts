import { test, expect } from "@playwright/test";
import { LANDING_VIDEOS } from "./fixtures/landing-videos";
import {
  closeLandingVideo,
  expectLandingVideoLoaded,
  gotoLandingPage,
  landingVideoIframe,
  openLandingVideoButton,
  stubYoutubeEmbeds,
} from "./helpers/landing-videos";

test.describe("Landing page videos", () => {
  test.beforeEach(async ({ page }) => {
    await stubYoutubeEmbeds(page);
    await gotoLandingPage(page);
  });

  for (const video of Object.values(LANDING_VIDEOS)) {
    test(`${video.buttonLabel} button opens YouTube embed`, async ({ page }) => {
      await openLandingVideoButton(page, video.buttonLabel);
      await expectLandingVideoLoaded(page, video.embedId, video.title);
    });
  }

  test("close X hides the embed", async ({ page }) => {
    const video = LANDING_VIDEOS.fun;

    await openLandingVideoButton(page, video.buttonLabel);
    await expectLandingVideoLoaded(page, video.embedId, video.title);

    await closeLandingVideo(page);
    await expect(landingVideoIframe(page, video.embedId)).toHaveCount(0);
  });

  test("clicking the same button again toggles the embed closed", async ({
    page,
  }) => {
    const video = LANDING_VIDEOS.impactful;

    await openLandingVideoButton(page, video.buttonLabel);
    await expectLandingVideoLoaded(page, video.embedId, video.title);

    await openLandingVideoButton(page, video.buttonLabel);
    await expect(landingVideoIframe(page, video.embedId)).toHaveCount(0);
  });

  test("only one embed is open at a time", async ({ page }) => {
    const fun = LANDING_VIDEOS.fun;
    const fitting = LANDING_VIDEOS.fitting;

    await openLandingVideoButton(page, fun.buttonLabel);
    await expectLandingVideoLoaded(page, fun.embedId, fun.title);

    await openLandingVideoButton(page, fitting.buttonLabel);
    await expect(landingVideoIframe(page, fun.embedId)).toHaveCount(0);
    await expectLandingVideoLoaded(page, fitting.embedId, fitting.title);
  });
});

test.describe("Landing page videos (embed network)", () => {
  test("opening a video requests the real YouTube embed URL", async ({ page }) => {
    const video = LANDING_VIDEOS.fun;
    const embedRequest = page.waitForRequest(
      (req) =>
        req.url().includes("youtube-nocookie.com/embed/") &&
        req.url().includes(video.embedId),
      { timeout: 15_000 },
    );

    await gotoLandingPage(page);
    await openLandingVideoButton(page, video.buttonLabel);

    const request = await embedRequest;
    expect(request.url()).toContain(`embed/${video.embedId}`);

    await expect(landingVideoIframe(page, video.embedId)).toHaveCount(1);
    await expect(landingVideoIframe(page, video.embedId)).toHaveAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${video.embedId}`,
    );
  });
});
