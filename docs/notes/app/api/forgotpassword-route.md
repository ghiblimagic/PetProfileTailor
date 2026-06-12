# Forgot password API

Source: [`app/api/forgotpassword/route.ts`](../../../../app/api/forgotpassword/route.ts)

`POST /api/forgotpassword` — finds user by email, stores SHA-256 reset token + expiry, emails plain token link via Resend.

Requires `RESEND_API_KEY`, `RESEND_EMAIL_FROM`, `NEXTAUTH_URL`.

## Related

- [verifyresetpasstoken-route.md](verifyresetpasstoken-route.md)
