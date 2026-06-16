# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-category-ui.spec.ts >> Admin category and tag UI >> admin creates name tag and attaches to category via react-select
- Location: e2e\admin-category-ui.spec.ts:96:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('option', { name: 'e2e-name-cat-attach-mqh1bnmk', exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('option', { name: 'e2e-name-cat-attach-mqh1bnmk', exact: true })

```

```yaml
- banner:
  - banner:
    - navigation "Primary navigation":
      - link "HomewardTails":
        - /url: /
      - list:
        - listitem:
          - link "Home":
            - /url: /
        - button "Fetch"
        - button "Add"
        - listitem:
          - link "About":
            - /url: /about
        - button "Admin"
      - link "Go to notifications":
        - /url: /notifications
      - button "Profile image Open profile menu":
        - img "Profile image"
        - text: Open profile menu
- main:
  - text: Enter a name tag to add
  - textbox "Enter a name tag to add": e2e-name-tag-attach-mqh1bnmk
  - text: Categories
  - log: 0 results available for search term e2e-name-cat-attach-mqh1bnmk.Use Up and Down to choose options, press Enter to select the currently focused option, press Escape to exit the menu, press Tab to select the option and exit the menu.
  - combobox "Categories" [expanded]: e2e-name-cat-attach-mqh1bnmk
  - listbox: No options
  - button "Submit tag"
- region "Notifications Alt+T"
- contentinfo:
  - link "HomewardTails":
    - /url: /
  - paragraph: Improving adoption rates through community!
  - heading "Find" [level=6]
  - list:
    - listitem:
      - link "Names":
        - /url: /fetchnames
    - listitem:
      - link "A Name":
        - /url: /fetchname
    - listitem:
      - link "Descriptions":
        - /url: /fetchdescriptions
  - heading "Add" [level=6]
  - list:
    - listitem:
      - link "Names":
        - /url: /addnames
    - listitem:
      - link "Descriptions":
        - /url: /adddescriptions
  - heading "Reach Out" [level=6]
  - list:
    - listitem:
      - link "Contact":
        - /url: /contact
    - link "Bluesky":
      - /url: https://bsky.app/profile/homewardtails.bsky.social
  - heading "Credits" [level=6]
  - link "Default icons by Freepik":
    - /url: https://www.freepik.com/author/freepik/icons/kawaii-flat_45#from_element=resource_detail
  - link "Thanks icon by Arfan Haq":
    - /url: https://thenounproject.com/browse/icons/term/thank-you/
  - text: © 2026 Janet Spellman. All rights reserved.
- alert
```

# Test source

```ts
  3   | export function uniqueE2ECategoryName(prefix: string): string {
  4   |   return `e2e-${prefix}-${Date.now().toString(36)}`;
  5   | }
  6   | 
  7   | export function uniqueE2ENameTag(prefix: string): string {
  8   |   return `e2e-${prefix}-${Date.now().toString(36)}`;
  9   | }
  10  | 
  11  | export function uniqueE2EDescriptionTag(prefix: string): string {
  12  |   return `e2e-${prefix}-${Date.now().toString(36)}`;
  13  | }
  14  | 
  15  | /** Wait until NextAuth session exposes admin role (client gates admin forms). */
  16  | export async function waitForAdminSession(page: Page): Promise<void> {
  17  |   await expect
  18  |     .poll(async () => {
  19  |       const response = await page.request.get("/api/auth/session");
  20  |       if (!response.ok()) return false;
  21  |       const session = (await response.json()) as {
  22  |         user?: { role?: string; status?: string };
  23  |       };
  24  |       return (
  25  |         session.user?.role === "admin" && session.user?.status === "active"
  26  |       );
  27  |     })
  28  |     .toBe(true);
  29  | }
  30  | 
  31  | export async function submitNameCategoryForm(
  32  |   page: Page,
  33  |   category: string,
  34  | ): Promise<number> {
  35  |   await page.locator("#categoryInput").fill(category);
  36  | 
  37  |   const responsePromise = page.waitForResponse(
  38  |     (response) =>
  39  |       response.url().includes("/api/namecategories") &&
  40  |       response.request().method() === "POST",
  41  |   );
  42  | 
  43  |   await page.getByRole("button", { name: "Submit name category" }).click();
  44  |   const response = await responsePromise;
  45  |   return response.status();
  46  | }
  47  | 
  48  | export async function submitDescriptionCategoryForm(
  49  |   page: Page,
  50  |   category: string,
  51  | ): Promise<number> {
  52  |   await page.locator("#categoryInput").fill(category);
  53  | 
  54  |   const responsePromise = page.waitForResponse(
  55  |     (response) =>
  56  |       response.url().includes("/api/descriptioncategory") &&
  57  |       response.request().method() === "POST",
  58  |   );
  59  | 
  60  |   await page
  61  |     .getByRole("button", { name: "Submit description category" })
  62  |     .click();
  63  |   const response = await responsePromise;
  64  |   return response.status();
  65  | }
  66  | 
  67  | export async function expectNameCategoryExists(
  68  |   request: APIRequestContext,
  69  |   category: string,
  70  | ): Promise<void> {
  71  |   const response = await request.get("/api/namecategories");
  72  |   expect(response.ok()).toBeTruthy();
  73  |   const categories = (await response.json()) as Array<{ category?: string }>;
  74  |   expect(
  75  |     categories.some((entry) => entry.category === category),
  76  |   ).toBeTruthy();
  77  | }
  78  | 
  79  | export async function expectDescriptionCategoryExists(
  80  |   request: APIRequestContext,
  81  |   category: string,
  82  | ): Promise<void> {
  83  |   const response = await request.get("/api/descriptioncategory");
  84  |   expect(response.ok()).toBeTruthy();
  85  |   const categories = (await response.json()) as Array<{ category?: string }>;
  86  |   expect(
  87  |     categories.some((entry) => entry.category === category),
  88  |   ).toBeTruthy();
  89  | }
  90  | 
  91  | export async function selectStyledSelectOptions(
  92  |   page: Page,
  93  |   inputId: string,
  94  |   optionLabels: string[],
  95  | ): Promise<void> {
  96  |   const input = page.locator(`#${inputId}`);
  97  |   await expect(input).toBeVisible({ timeout: 15_000 });
  98  | 
  99  |   for (const label of optionLabels) {
  100 |     await input.click();
  101 |     await input.fill(label);
  102 |     const option = page.getByRole("option", { name: label, exact: true });
> 103 |     await expect(option).toBeVisible({ timeout: 15_000 });
      |                          ^ Error: expect(locator).toBeVisible() failed
  104 |     await option.click();
  105 |   }
  106 | }
  107 | 
  108 | export async function createNameCategoryViaApi(
  109 |   page: Page,
  110 |   category: string,
  111 | ): Promise<void> {
  112 |   const response = await page.request.post("/api/namecategories", {
  113 |     data: { category },
  114 |   });
  115 |   expect(response.status()).toBe(201);
  116 | }
  117 | 
  118 | export async function createDescriptionCategoryViaApi(
  119 |   page: Page,
  120 |   category: string,
  121 | ): Promise<void> {
  122 |   const response = await page.request.post("/api/descriptioncategory", {
  123 |     data: { category },
  124 |   });
  125 |   expect(response.status()).toBe(201);
  126 | }
  127 | 
  128 | export async function submitNameTagFormWithCategories(
  129 |   page: Page,
  130 |   tag: string,
  131 |   categoryLabels: string[],
  132 | ): Promise<{ postStatus: number; putStatus: number | null }> {
  133 |   await page.locator("#categoryInput").fill(tag);
  134 |   if (categoryLabels.length > 0) {
  135 |     await selectStyledSelectOptions(page, "categoryTags", categoryLabels);
  136 |   }
  137 | 
  138 |   const postPromise = page.waitForResponse(
  139 |     (response) =>
  140 |       response.url().includes("/api/nametag") &&
  141 |       response.request().method() === "POST",
  142 |   );
  143 |   const putPromise =
  144 |     categoryLabels.length > 0
  145 |       ? page.waitForResponse(
  146 |           (response) =>
  147 |             response.url().includes("/api/namecategories/edittags") &&
  148 |             response.request().method() === "PUT",
  149 |         )
  150 |       : null;
  151 | 
  152 |   await page.getByRole("button", { name: "Submit tag" }).click();
  153 |   const postResponse = await postPromise;
  154 |   const putResponse = putPromise ? await putPromise : null;
  155 |   return {
  156 |     postStatus: postResponse.status(),
  157 |     putStatus: putResponse?.status() ?? null,
  158 |   };
  159 | }
  160 | 
  161 | export async function submitDescriptionTagFormWithCategories(
  162 |   page: Page,
  163 |   tag: string,
  164 |   categoryLabels: string[],
  165 | ): Promise<{ postStatus: number; putStatus: number | null }> {
  166 |   await page.locator("#categoryInput").fill(tag);
  167 |   if (categoryLabels.length > 0) {
  168 |     await selectStyledSelectOptions(page, "descriptionTags", categoryLabels);
  169 |   }
  170 | 
  171 |   const postPromise = page.waitForResponse(
  172 |     (response) =>
  173 |       response.url().includes("/api/descriptiontag") &&
  174 |       response.request().method() === "POST",
  175 |   );
  176 |   const putPromise =
  177 |     categoryLabels.length > 0
  178 |       ? page.waitForResponse(
  179 |           (response) =>
  180 |             response.url().includes("/api/descriptioncategory/edittags") &&
  181 |             response.request().method() === "PUT",
  182 |         )
  183 |       : null;
  184 | 
  185 |   await page.getByRole("button", { name: "Submit tag" }).click();
  186 |   const postResponse = await postPromise;
  187 |   const putResponse = putPromise ? await putPromise : null;
  188 |   return {
  189 |     postStatus: postResponse.status(),
  190 |     putStatus: putResponse?.status() ?? null,
  191 |   };
  192 | }
  193 | 
  194 | export async function expectNameTagAttachedToCategory(
  195 |   request: APIRequestContext,
  196 |   categoryName: string,
  197 |   tagName: string,
  198 | ): Promise<void> {
  199 |   const response = await request.get("/api/namecategories");
  200 |   expect(response.ok()).toBeTruthy();
  201 |   const categories = (await response.json()) as Array<{
  202 |     category?: string;
  203 |     tags?: Array<{ tag?: string } | string>;
```