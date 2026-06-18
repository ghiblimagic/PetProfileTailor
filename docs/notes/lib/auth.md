# lib/auth (NextAuth)

**Source:** [`lib/auth.ts`](../../lib/auth.ts)

NextAuth configuration: credentials (email/password) + email (magic link), JWT sessions, MongoDB adapter.

---

## Session strategy

```ts
session: {
  strategy: "jwt",
  maxAge: 60 * 60 * 24,   // how long the JWT/session is valid (e.g., 24 hours)
  updateAge: 30 * 60,     // refresh token after 30 minutes to catch banned users
}
```

JWT is required for `CredentialsProvider` to work properly.

- [NextAuth credentials provider docs](https://next-auth.js.org/configuration/providers/credentials)
- [GitHub issue #3970](https://github.com/nextauthjs/next-auth/issues/3970) — why JWT strategy with credentials

`updateAge` triggers the `jwt` callback periodically so we can re-fetch `status` from the DB and invalidate banned/deleted users without waiting for full session expiry.

---

## How sign-in flows map to providers

| Flow | Trigger | Route |
|------|---------|-------|
| Email + password | `await signIn("credentials", ...)` on submit | `/api/auth/signin/credentials` |
| Magic link | Form `method="post"` `action="/api/auth/signin/email"` | Email provider |

---

## Callbacks

### signIn
```
async signIn({ user, account, profile, email, credentials }) {

    
      try {
        await db.connect();
        const userExists = await User.findOne({
          email: user.email, 
        });

        
        if (userExists && userExists.status === "banned") {
          return "/login?error=Banned";
        }

         //  MAGIC LINK (email provider)
        if (account.provider === "email") {
               return true;
        }

         //  EMAIL + PASSWORD (credentials provider)
        if (account.provider === "credentials") {
             if (userExists) return true;
          return "/login?error=UserNotFound";
        }
        return true;

      } catch (err) {
        console.error("Error in signIn callback:", err);
        return "/login?error=DBUnavailable";
      }

```

[Callback parameter names](https://next-auth.js.org/configuration/callbacks) — checks if the email exists in the database before allowing sign-in.

**Steps:**

1. `User.findOne({ email: user.email })` — `user.email` is what the user entered
2. **Banned** (including magic-link users) → `/login?error=Banned`
3. **Email provider (magic link)** → `true`
   - NextAuth automatically redirects email sign-ins to the verifyRequest page anyway
   - Magic link redirects must be **absolute URLs or `true`** — NextAuth uses `new URL()` internally, not `res.redirect()`
   - Relative paths like `/login?error=...` work for error redirects; verify flow uses `new URL()` so behave differently
4. **Credentials provider** (Email + password)→ allow only if `userExists`, else `/login?error=UserNotFound`
5. **Fallback** → `true`
6. **DB error** → `/login?error=DBUnavailable`

Branching logic lives in [`lib/resolveSignInCallback.ts`](../../lib/resolveSignInCallback.ts) (unit tested in [`lib/resolveSignInCallback.test.ts`](../../lib/resolveSignInCallback.test.ts)).

### jwt

```ts
if (user) {
  token.user = toTokenUser(user);
}
```

**Helpers in [`lib/auth.ts`](../../lib/auth.ts):**

- `toCredentialsUser(doc)` — maps `IUserDocument` to NextAuth `User` with `id: doc._id.toString()`
- `toTokenUser(user)` — maps sign-in `User` to `Session["user"]` with `id: user.id` (required on our augmented `User` type)

**On `trigger === "update"`** (client calls `session.update()`):

```ts
token.user = { ...token.user, ...session.user };
```

**On initial sign-in (`user` present):** `token.user = toTokenUser(user)`

| Field | Notes |
|-------|-------|
| `id` | `user.id` — always set: credentials via `toCredentialsUser`, magic link via MongoDB adapter |
| `name`, `profileName`, `profileImage`, `role`, `status` | From sign-in user |
| `bio`, `location` | From sign-in user (optional on `User`; may be undefined until profile update) |

**On refresh** (no `user`, but `token.user?.id` exists) — runs when `updateAge` is reached (or every request in E2E when `E2E_TEST_MODE` sets `updateAge: 0`):

- Re-fetch `status` from DB via `UserModel.findById(token.user.id).select("status")`
- If user deleted or **banned** → `token.user = null`
- If user active (or other non-banned status) → update `token.user.status`
- Errors logged, token left as-is on failure

### session

```ts
if (!token.user) {
  return null as unknown as typeof session;
}
session.user = token.user;
return session;
```

- Check `token.user` first — when banned/deleted, JWT clears `token.user` but NextAuth may still pass a stale `session.user` (email/name from the token root). Returning `null` invalidates the session.
- If `token.user` exists → copy onto `session.user` (only safe fields from `toTokenUser`).

---

## Providers

### CredentialsProvider

`authorize` validates email/password, then returns `toCredentialsUser(user)`:

```ts
function toCredentialsUser(doc: IUserDocument): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    profileName: doc.profileName,
    email: doc.email,
    profileImage: doc.profileImage,
    role: doc.role,
    status: doc.status,
  };
}
```

**Steps:**

1. `UserModel.findOne({ email })`
2. No user → throw `"Invalid email or password"`
3. `status === "banned"` → throw ban message
4. `bcryptjs.compareSync(password, user.password)` — rejects if password missing (magic-link-only accounts)
5. Return `toCredentialsUser(user)`

**Why string `id` from `_id`:**

Credentials and magic-link sign-in both end up with `session.user.id` as a string, not `session.user._id`.

Returned fields: `id`, `name`, `profileName`, `email`, `profileImage`, `role`, `status`.

### EmailProvider (magic link)

```
 EmailProvider({
    server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.RESEND_EMAIL_FROM,
      sendVerificationRequest,
    }),
 

```

Some provider properties **cannot** be edited inside the provider config — e.g. the verifyRequest callback URL must be set in `pages.verifyRequest`, not here.

Example of what the provider object looks like internally (for reference):

```
provider: {
  id: 'email',
  type: 'email',
  name: 'Email',
  server: { host: 'smtp.resend.com', port: '465', auth: [Object] },
  from: 'no-reply@...',
  maxAge: 86400,
  sendVerificationRequest: [AsyncFunction],
  signinUrl: 'http://localhost:3000/api/auth/signin/email',
  callbackUrl: 'http://localhost:3000/api/auth/callback/email'
}
```

**Magic link + MongoDB:**

- Database required to create a magic link
- Verification token stored in MongoDB `verification_tokens` collection **and** sent in the email link

**Server config:** Resend SMTP via env vars (`EMAIL_SERVER_*`, `RESEND_EMAIL_FROM`).

**`sendVerificationRequest`:** Custom email body — [NextAuth customising emails](https://next-auth.js.org/providers/email#customising-emails). Under the hood uses nodemailer; our implementation is [`lib/send-verification-request.ts`](../../lib/send-verification-request.ts) (Resend + React email template).

---

## Custom pages

[NextAuth pages config](https://next-auth.js.org/configuration/pages)

```ts
pages: {
  verifyRequest: "/magiclink",
}
```

Overwrites NextAuth default verifyRequest page for email/magic-link login.

---

## TypeScript

Session user shape (`id`, `role`, `status`, profile fields): [`types/next-auth.d.ts`](../../types/next-auth.d.ts)

- `User.id` is **required** (string) on our augmentation — set in `toCredentialsUser` / adapter sign-in
- `role` / `status` use `UserRole` / `UserStatus` from [`models/User.ts`](../../models/User.ts)

Replaces the old `AppUser` casts in `checkIfAdmin` / `checkOwnership`.

---

## App Router `[...nextauth]` route

Source: [`app/api/auth/[...nextauth]/route.ts`](../../app/api/auth/[...nextauth]/route.ts)

Normally, App Router API routes require `route.ts` to export named handlers (`GET`, `POST`, `PUT`, etc.). The NextAuth catch-all is a special case: `NextAuth(serverAuthOptions)` returns a single handler that must be exported as **both** `GET` and `POST` — the framework wires `/api/auth/*` correctly from that pattern.

```ts
const handler = NextAuth(serverAuthOptions);
export { handler as GET, handler as POST };
```

All provider config, callbacks, and adapters live in [`lib/auth.ts`](../../lib/auth.ts); the route file is only this thin wrapper.

---

## Related files

| File | Role |
|------|------|
| [`app/api/auth/[...nextauth]/route.ts`](../../app/api/auth/[...nextauth]/route.ts) | Exports GET/POST NextAuth handler (see above) |
| [`app/api/auth/lib/mongodb.ts`](../../app/api/auth/lib/mongodb.ts) | `clientPromise` for MongoDB adapter |
| [`utils/api/getSessionForApis.ts`](../../utils/api/getSessionForApis.ts) | API route session helper |
| [`lib/resolveSignInCallback.ts`](../../lib/resolveSignInCallback.ts) | Pure signIn branching |
| [`lib/resolveSignInCallback.test.ts`](../../lib/resolveSignInCallback.test.ts) | Unit tests for signIn branching |
| [`lib/auth.test.ts`](../../lib/auth.test.ts) | Unit tests for `signIn` / `jwt` / `session` callbacks and credentials `authorize` |
| [`utils/api/getSessionForApis.test.ts`](../../utils/api/getSessionForApis.test.ts) | Unit tests for API session helper (401 vs ok) |
| [`TESTING.md`](../../TESTING.md) | Manual auth guard checks |
