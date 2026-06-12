# Verify reset password token API

Source: [`app/api/verifyresetpasstoken/route.ts`](../../../../app/api/verifyresetpasstoken/route.ts)

`POST /api/verifyresetpasstoken` — `{ token }` hashed and matched against `User.passwordResetToken` with valid `resetTokenExpires`. Returns user doc on success.

## Related

- [forgotpassword-route.md](forgotpassword-route.md)
