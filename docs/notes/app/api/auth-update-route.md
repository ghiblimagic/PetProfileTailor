# Auth update API

Source: [`app/api/auth/update/route.ts`](../../../../app/api/auth/update/route.ts)

`PUT /api/auth/update` — signed-in user updates `name`, `email`, optional `password` (bcrypt hash). Used by [`editsettings/page.tsx`](../../../../app/(protected)/editsettings/page.tsx).

**Unauthenticated reset path:** when no session, accepts `userid`, `email`, and `password` if the user has a valid non-expired `passwordResetToken` (used by [`ResetPassword.tsx`](../../../../components/ResetPassword.tsx)). Clears reset token fields after success.

## Related

- [editsettings-page.md](../editsettings-page.md)
