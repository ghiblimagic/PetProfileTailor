import { expect, type Page, type Locator } from "@playwright/test";

function profileBioModal(page: Page): Locator {
  return page.locator('[aria-labelledby="modal-title"]');
}

export async function openProfileBioEdit(page: Page): Promise<void> {
  await page.getByRole("button", { name: "edit" }).click();
  await expect(profileBioModal(page).getByText("Bio", { exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

export async function fillProfileBio(page: Page, bio: string): Promise<void> {
  await profileBioModal(page).locator("textarea").fill(bio);
}

export async function saveProfileBioEdit(page: Page): Promise<void> {
  const modal = profileBioModal(page);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/user/editbiolocationavatar") &&
      response.request().method() === "PUT",
  );
  await modal.getByRole("button", { name: "save" }).click();
  await responsePromise;
}
