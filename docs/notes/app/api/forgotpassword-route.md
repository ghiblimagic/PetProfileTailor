# Forgot password API

Source: [`app/api/forgotpassword/route.ts`](../../../../app/api/forgotpassword/route.ts)

`POST /api/forgotpassword` — finds user by email, stores SHA-256 reset token + expiry, emails plain token link via Resend.

Requires `RESEND_API_KEY`, `RESEND_EMAIL_FROM`, `NEXTAUTH_URL`.

When `E2E_TEST_MODE=true`, Resend send is skipped (token still saved) so Playwright can assert 200 without email.

## Related

- [verifyresetpasstoken-route.md](verifyresetpasstoken-route.md)
