# Auth UI pages

| Route | Server | Client component |
|-------|--------|------------------|
| `/login` | [`app/login/page.tsx`](../../../app/login/page.tsx) | [`components/login.tsx`](../../../components/login.tsx) |
| `/register` | — (client page) | [`RegisterForm.tsx`](../../../components/Register/RegisterForm.tsx) |
| `/forgotpassword` | [`app/forgotpassword/page.tsx`](../../../app/forgotpassword/page.tsx) | [`forgotpassword.tsx`](../../../components/forgotpassword.tsx) |
| `/resetpassword/[token]` | [`app/resetpassword/[token]/page.tsx`](../../../app/resetpassword/[token]/page.tsx) | [`ResetPassword.tsx`](../../../components/ResetPassword.tsx) |
| `/magiclink` | — | [`app/magiclink/page.tsx`](../../../app/magiclink/page.tsx) |

## Patterns

- Server pages call `getServerSession` and `redirect("/dashboard")` when already signed in.
- Login: credentials via `signIn("credentials")` + magic link via `signIn("email")` with cooldown ([`useLocalStorageCooldown`](../../../hooks/useLocalStorageCooldown.ts)).
- Reset: `POST /api/verifyresetpasstoken` → `PUT /api/auth/update` → auto `signIn` with new password.

## Fixes during TS conversion

- `resetpassword/[token]/page` was missing `redirect` import (now typed).
- `ResetPassword`: removed dead `sessionFromServer` / `router.query` (Pages Router).
- Login: redirect to dashboard only after successful credentials sign-in.

## Implementation notes (from original JS)

### Server pages (`login`, `forgotpassword`, `resetpassword`)

- `getServerSession` on the server route redirects signed-in users to `/dashboard` before rendering the client form.
- Client components also use `useSession()` because the session updates **after** sign-in on the client; the server check alone is not enough post-login.

### `login.tsx`

- **`redirect: false` on `signIn("credentials")`** — avoids NextAuth callback URL behavior; client handles navigation after `useSession` updates ([video note in source](https://www.youtube.com/watch?v=EFucgPdjeNg&t=594s)).
- **Deferred dashboard redirect** — `setRedirect(true)` then `useEffect` waits for `session` from `useSession()` before `router.replace("/dashboard")` (redirect was firing too early).
- **Magic link** — `signIn("email", { redirect: false })`; always send user to `/magiclink?email=…` when `result` is truthy (no hint whether email exists). Honeypot field `website` blocks bots.
- **Cooldown** — `useLocalStorageCooldown` rate-limits magic-link requests.
- **Query errors** — `?error=Banned` / `?error=UserNotFound` / `?error=DBUnavailable` from [`lib/auth` signIn callback](../lib/auth.md) shown once via toast.

### `forgotpassword.tsx`

- Treat **404 and 200** the same in UI — do not reveal whether the email exists ([`forgotpassword` API](api/forgotpassword-route.md) returns 404 for unknown emails).

### `ResetPassword.tsx`

- Verify token via `POST /api/verifyresetpasstoken`; on failure set `error` and **disable** password fields.
- After successful `PUT /api/auth/update`, auto `signIn("credentials")` with the new password (`redirect: false`).

## Inline comments in source

JSX section labels (`{/* <!-- Login Button --> */}`, `################ Magic Link #####################`) kept in `.tsx` for skimming. Longer behavior notes live in this file per [preserving-migration-notes.md](../typescript/preserving-migration-notes.md).

## Related

- [auth.md](../lib/auth.md)
- [signup-route.md](api/signup-route.md)
- [forgotpassword-route.md](api/forgotpassword-route.md)
