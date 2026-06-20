# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reset-password.spec.ts >> Reset password >> user resets password via token and signs in with new password
- Location: e2e\reset-password.spec.ts:21:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Password updated successfully/i)
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/Password updated successfully/i)

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
      - link "login":
        - /url: /login
      - link "register":
        - /url: /register
- main:
  - img "A guinea pig looks at the screen calmly as it sits on a keyboard"
  - text: Reset Password Password
  - textbox "Password" [disabled]:
    - /placeholder: password
    - text: newpass456789
  - text: Confirm New Password
  - textbox "Confirm New Password": newpass456789
  - alert: "There was an error with api route `auth update` for resetting your password, try again. If error persists contact us and send this error message"
  - button "Reset Password"
  - paragraph:
    - text: Don't have an account? Welcome!
    - link "Register by clicking here":
      - /url: /register
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
  1  | import { test, expect } from "@playwright/test";
  2  | import { signOutViaNav } from "./helpers/auth";
  3  | import { registerNewUser } from "./helpers/register";
  4  | import {
  5  |   setE2ePasswordResetToken,
  6  |   submitResetPasswordForm,
  7  | } from "./helpers/reset-password";
  8  | 
  9  | test.describe("Reset password", () => {
  10 |   test("invalid token shows error and disables password fields", async ({
  11 |     page,
  12 |   }) => {
  13 |     await page.goto("/resetpassword/not-a-valid-reset-token");
  14 | 
  15 |     await expect(
  16 |       page.getByText(/Invalid reset token or token has expired/i),
  17 |     ).toBeVisible({ timeout: 15_000 });
  18 |     await expect(page.locator("#password")).toBeDisabled();
  19 |   });
  20 | 
  21 |   test("user resets password via token and signs in with new password", async ({
  22 |     page,
  23 |   }) => {
  24 |     test.setTimeout(90_000);
  25 | 
  26 |     const profileName = `e2e${Date.now().toString(36)}`;
  27 |     const email = `e2e-reset-${Date.now()}@example.com`;
  28 |     const originalPassword = "testpass123";
  29 |     const newPassword = "newpass456789";
  30 | 
  31 |     await registerNewUser(page, {
  32 |       name: "E2E Reset Test",
  33 |       profilename: profileName,
  34 |       email,
  35 |       password: originalPassword,
  36 |     });
  37 | 
  38 |     const token = await setE2ePasswordResetToken(page);
  39 |     await signOutViaNav(page);
  40 | 
  41 |     await page.goto(`/resetpassword/${token}`);
  42 |     await expect(page.locator("#password")).toBeEnabled({ timeout: 15_000 });
  43 | 
  44 |     await submitResetPasswordForm(page, newPassword);
  45 | 
  46 |     await expect(
  47 |       page.getByText(/Password updated successfully/i),
> 48 |     ).toBeVisible({ timeout: 15_000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  49 |     await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  50 | 
  51 |     await signOutViaNav(page);
  52 | 
  53 |     await page.goto("/login");
  54 |     await page.locator("#email").fill(email);
  55 |     await page.locator("#password").fill(newPassword);
  56 |     await page.getByRole("button", { name: "sign in", exact: true }).click();
  57 |     await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  58 |   });
  59 | });
  60 | 
```