# signup API route

Source: [`app/api/auth/signup/route.ts`](../../../../app/api/auth/signup/route.ts)

## Overview

`POST /api/auth/signup` — creates a password or magic-link user from the register form. Used by `RegisterForm.tsx`.

## Flow

1. reCAPTCHA v3 verify (skipped when `E2E_TEST_MODE` + `e2e-bypass` token)
2. Field validation — [`validateSignupSubmission.ts`](../../../../utils/api/validateSignupSubmission.ts)
3. Async uniqueness — profile name (`getUserByProfileName`), email (`User.findOne`)
4. `User.create` with hashed password when provided; default avatar from schema

## Responses

| Status | Body |
|--------|------|
| 201 | `{ message, _id, profileName, name, email, over13 }` |
| 400 | Captcha missing / failed |
| 422 | `{ errors: { name?, profilename?, email?, password?, over13? } }` |
| 500 | Captcha verify network error |

## Related

- [`utils/api/e2eTestMode.ts`](../../../../utils/api/e2eTestMode.ts) — E2E captcha bypass
- [`e2e/register.spec.ts`](../../../../e2e/register.spec.ts) — duplicate profile name / email
- [`models/User.ts`](../../../../models/User.ts) — `chooseRandomDefaultAvatar` default
