# Testing

## Stack

- **Jest** — unit and integration tests
- **React Testing Library** — component tests
- **Playwright** — E2E tests

Vitest would have been easier to set up with TypeScript, but Jest was chosen for maturity, ecosystem, CI/coverage support, snapshots, and RTL's default pairing — experience that transfers to most existing codebases.

## Scripts


| Command           | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `pnpm test`       | Run Jest once                                                        |
| `pnpm test:watch` | Jest watch mode                                                      |
| `pnpm test:ci`    | Jest in CI with coverage                                             |
| `pnpm test:e2e`   | Playwright E2E (builds and starts app unless server already running) |


## Convert-then-test workflow

When converting files during the TypeScript migration:

1. Convert the file (`.js` → `.ts` or `.jsx` → `.tsx`)
2. Add or update tests for that file if it contains testable logic
3. Run `pnpm test` and `pnpm build` before merging

Do **not** block low-risk conversions on full coverage. Do **block** high-risk areas (`lib/auth.ts`, rate limiter, ownership checks) without at least smoke tests.

## Where tests live

- Unit tests: co-located as `*.test.ts` next to the module (e.g. `utils/error.test.ts`)
- Component tests: co-located as `*.test.tsx` (e.g. `components/ui/skeleton.test.tsx`)
- E2E tests: `e2e/*.spec.ts`
- Design / learning notes: `[docs/notes/](docs/notes/)` (see `[docs/README.md](docs/README.md)`)

## E2E notes

Playwright starts the app via `pnpm build && pnpm start`. For local runs, you can start `pnpm dev` or `pnpm start` first; Playwright reuses an existing server when not in CI.

Login E2E is a **smoke test** (page renders) — it does not require a test database or successful authentication.

---

## Manual verification (TypeScript migration)

Use this after converting modules or before merging a migration PR. Automated tests catch compile errors and unit logic; these checks catch wiring and runtime issues in the real app.

### Baseline

```bash
pnpm test
pnpm build
pnpm dev
```

Local green + Vercel green means TS modules compile and unit tests pass. Manual checks below cover integration paths Jest does not exercise.

### Recent commits — auth + utils wave 3

Targeted smoke tests for the last two migration commits. Run **after** the baseline above. Estimated **~25–35 min** if you cover both.

| Commit | Summary |
|--------|---------|
| `b1f0994` | `lib/auth.ts`, `models/User.ts`, NextAuth type augmentation, `resolveSignInCallback` |
| `b29c9e7` | `getUserByProfileName`, `startCooldown`, `findNormalizedMatch` (+ unit tests) |

#### Quick pass — `b1f0994` auth + User model (~15 min)

Code touched: `lib/auth.ts`, `models/User.ts`, `types/next-auth.d.ts`, `checkIfAdmin`, `checkOwnership`, `getSessionForApis`.

- [ ] `/login` — credentials login with valid email + password → nav shows logged-in state
- [ ] `/login` — wrong password → error message, no session
- [ ] `/login` — magic link request (skip if Resend not configured) → redirect to `/magiclink`, email arrives
- [ ] Magic link — click email link → logged in; refresh keeps session
- [ ] Nav / profile — avatar and `profileName` visible after login (admin menu too if admin)
- [ ] `/dashboard` — loads when logged in
- [ ] `/notifications` — loads when logged in
- [ ] `/dashboard` — logged out → redirect or login prompt (not 500)
- [ ] Sign out → credentials login again → session restored
- [ ] `/register` — new user with unique email + profile name → account created, default avatar assigned
- [ ] `/register` — existing `profileName` → rejected before account created
- [ ] Admin — edit category or tag while logged in as admin → succeeds
- [ ] Admin — same action as non-admin (or watch Network on admin API) → 401/403, not 500
- [ ] Content — edit your own name/description → saves
- [ ] Content — edit someone else's entry → blocked (403/401, not 500)

Optional: banned account → ban error on login; or mid-session ban + session refresh → logged out.

#### Quick pass — `b29c9e7` utils wave 3 (~10 min)

Code touched: `getUserByProfileName.ts`, `startCooldown.ts`, `findNormalizedMatch.ts` (used in names/description APIs and listing pagination).

- [ ] `/profile/[profilename]` — known user's profile loads (avatar, lists; not 404/500)
- [ ] `getUserByProfileName` — `/register` with taken profile name → rejected (same check as auth pass above)
- [ ] `findExactNormalized` — `/addnames` submit duplicate name (`Fluffy` when `fluffy` exists) → 409 / “already exists”
- [ ] `findExactNormalized` — edit a description to text that matches another entry → duplicate blocked
- [ ] `findStartNormalized` — `/adddescriptions` → “Check if a description exists” → paste **start** of existing description → duplicate message + existing content shown
- [ ] `findStartNormalized` — same UI, text matching only the **middle** of an existing description → **not** flagged as duplicate
- [ ] `startCooldown` — `/fetchnames` or `/fetchdescriptions` → spam pagination **next** → ~15s cooldown, cannot instant-click through
- [ ] `startCooldown` — same pages → rapid sort or filter changes → ~3s cooldown between actions

**Note:** Name “check if exists” on `/fetchname` uses its own route, not `findNormalizedMatch`. Description live check on `/adddescriptions` **does** use `findStartNormalized`.

**Regression signals for these commits:**

| Symptom | Likely cause |
|---------|----------------|
| Login succeeds but nav shows logged out | `session` / `jwt` callback or `toTokenUser` |
| `profileName` or `role` missing in UI | NextAuth augmentation / JWT payload |
| Profile page 500 for valid user | `getUserByProfileName` or `db.connect` |
| Duplicate name slips through on submit | `findExactNormalized` |
| Description check never finds known duplicate | `findStartNormalized` / normalization |
| Pagination or sort spam works with no delay | `startCooldown` |

---

### Quick pass (~15–20 min)

- [x] `/fetchnames` — name list loads
- [x] One `/name/[name]` page — content, tags, categories render
- [x] One `/profile/[profilename]` page — user data and lists load
- [x] Log in → `/notifications` — tabs and notification items load
- [x] `/contact` — one legitimate submit (wait **>3 seconds** before clicking submit)
- [x] `/contact` — one obvious spam submit (gibberish name or message) → rejected
- [x] One owner action (edit your own content) — still works
- [x] Rapid-click a rate-limited button (like/follow) — throttles, no double submit

---

### 1. DB + `mongoDataCleanup` (`utils/db.ts`, `leanWithStrings`)

Used across pages and API routes. Regressions often show as **500 errors**, blank sections, or IDs displayed as `[object Object]`.


| Check         | Route / action                          | Pass criteria                                  |
| ------------- | --------------------------------------- | ---------------------------------------------- |
| Name browse   | `/fetchnames`                           | List loads; no server error                    |
| Name detail   | `/name/[name]`                          | Page renders with related data                 |
| Description   | `/description/[id]`                     | Content loads                                  |
| Profile       | `/profile/[profilename]`                | Profile, lists, images load                    |
| Dashboard     | `/dashboard` (logged in)                | Dashboard data renders                         |
| Notifications | `/notifications` (logged in)            | Like/thank items show linked content           |
| API shape     | DevTools → Network → data API responses | `_id` values are **strings**; no `__v` in JSON |


**Network tip:** open Response tab on a data-heavy request. String IDs mean `leanWithStrings` is working.

---

### 2. Contact spam + rate limiter (`detectBotPatterns`, `rateLimiter`)

Used in `app/actions/sendContactEmail.js` on `**/contact`**.


| Check                | Input                                              | Expected                                     |
| -------------------- | -------------------------------------------------- | -------------------------------------------- |
| Happy path           | Real name + normal message; wait >3s before submit | Success (or email sent if Resend configured) |
| Gibberish name       | 19+ letter token (e.g. `abcdefghijklmnopqrst`)     | Rejected                                     |
| Gibberish message    | Long random / spam-like text                       | Rejected                                     |
| Legitimate long name | e.g. `Wojciechowski` + normal message              | Allowed                                      |
| Rate limit           | Two submits from same IP within preset window      | Second blocked                               |
| Non-English message  | e.g. Chinese inquiry text                          | Allowed (CJK rules removed)                  |


---

### 3. Auth guards (`checkIfAdmin`, `checkOwnership`, `getSessionForApis`)


| Check                   | Actor      | Expected                  |
| ----------------------- | ---------- | ------------------------- |
| Admin category/tag edit | Admin user | Works as before           |
| Admin category/tag edit | Non-admin  | 401/403, not 500          |
| Edit own content        | Owner      | Works                     |
| Edit others' content    | Non-owner  | Blocked cleanly (not 500) |


If you lack admin UI handy, hit admin API routes in Network while logged in as a normal user and confirm 401/403.

---

### 4. Name normalization (`normalizeString`)

Used in name create/search and check-if-content-exists flows.


| Check                                                  | Expected                        |
| ------------------------------------------------------ | ------------------------------- |
| Search or create with spaces/punctuation/case variants | Same normalized match as before |
| Duplicate name detection when adding content           | Still catches duplicates        |


---

### 5. Smaller converted modules


| Module                           | Where to check                                                      |
| -------------------------------- | ------------------------------------------------------------------- |
| `chooseRandomDefaultAvatar`      | Register new user → default profile avatar assigned                 |
| `getError`                       | `/editsettings` — trigger validation error → message still displays |
| `useApiRateLimiter` + `debounce` | Toggle/cooldown buttons — rapid clicks throttled                    |
| `checkIfValidContentType`        | Names/descriptions listing pages load via SWR/API                   |


---

### Regression signals


| Symptom                                                  | Likely cause                                       |
| -------------------------------------------------------- | -------------------------------------------------- |
| 500 on page load                                         | `db.connect` or `leanWithStrings` on that route    |
| Hydration error / "Objects are not valid as React child" | ObjectId not stringified (`mongoDataCleanup`)      |
| Contact always fails                                     | Rate limiter or bot detection too aggressive       |
| Admin/owner action returns 500                           | `checkIfAdmin` / `checkOwnership` session handling |


---

### Optional automated smoke

```bash
pnpm exec playwright install   # once
pnpm test:e2e                  # login page render only
```

E2E does not replace the manual checks above.