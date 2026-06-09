import { test, expect } from "@playwright/test";

test.describe("Browse smoke", () => {
  test("/fetchnames loads without server error", async ({ page }) => {
    const response = await page.goto("/fetchnames");
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByText("Server error")).not.toBeVisible();
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("/fetchdescriptions loads without server error", async ({ page }) => {
    const response = await page.goto("/fetchdescriptions");
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByText("Server error")).not.toBeVisible();
  });

  test("names API returns string _id values without __v", async ({ request }) => {
    const response = await request.post("/api/names/swr", {
      data: { page: 1 },
    });
    expect(response.ok()).toBeTruthy();

    const json = (await response.json()) as {
      data?: Array<{ _id: unknown; __v?: unknown }>;
    };

    if (!json.data?.length) {
      test.skip(true, "No names in test DB to assert _id shape");
    }

    for (const item of json.data!) {
      expect(typeof item._id).toBe("string");
      expect(item.__v).toBeUndefined();
    }
  });
});
