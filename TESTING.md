# Testing

## Stack

- **Vitest** — test runner for unit, API, hook, and component tests (`*.test.ts` / `*.test.tsx`)
- **React Testing Library** — component and hook tests (via Vitest + jsdom)
- **Playwright** — E2E on test DB (`MONGODB_URI_TEST`)

## Test suite overview

Counts from `pnpm test` and `pnpm exec playwright test --list` (update after large test additions).

| Layer | Tool | Test cases | Files |
|-------|------|------------|-------|
| Unit / component / API | **Vitest** | **269** | **53** |
| End-to-end | **Playwright** | **169** | **28** spec files |
| **Total automated** | | **438** | **81** |

Vitest is a single runner. Of the 269 cases, roughly **170+** are pure unit/API tests and **90–100** use React Testing Library. Details below. Per-spec E2E inventory: [What E2E covers](#what-e2e-covers).

### Playwright E2E (169 tests, 28 spec files)

Full browser flows against a seeded test DB:

- **Auth** — login, ban, magic link, session refresh
- **CRUD** — names, descriptions, edits, delete
- **Social** — likes, thanks, notifications UI + API
- **Admin** — categories, tags, moderation
- **Contact form**, register, profile, reset password
- **Browse**, pagination/cooldown, data-shape/API contracts

Runs in CI with ephemeral MongoDB (replica set for transactions), seed-before-suite, and E2E test hooks. See [Before merge (automated)](#before-merge-automated).

### Pure unit / API tests (about 30 files, 170+ tests)

No browser UI — logic, validation, guards:

- **API validation** — contact, signup, names, blocklists, pagination
- **Auth** — NextAuth callbacks, password reset, session helpers
- **Utilities** — rate limiter, debounce, string normalization, ObjectId conversion
- **API route** — `PUT /api/auth/update` (Node env, mocked DB/session)

### React Testing Library (about 23 files, 90–100 tests)

Uses `@testing-library/react` (and often `userEvent`) for UI and hooks:

- **Components** — e.g. `RegisterForm`, `CheckIfContentExists`, buttons, alerts, skeletons (about 11 component test files)
- **Hooks** — `useToggleState`, `useSwrPagination`, `useDeleteConfirmation`, etc. (often via `renderHook`)
- **Context** — `LikesContext`, `notificationsContext`

RTL pattern notes: small harness with `useState` for dismiss flows; `userEvent` for clicks. API guards mock `getSessionForApis` via `vi.hoisted`. See also the [Unit + component](#unit--component-vitest--rtl) area table below.

**Not counted:** manual checks (real captcha, Resend email) in [Manual verification (dev only)](#manual-verification-dev-only); Next.js `build` type-check/lint during CI.

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm test` | Vitest once |
| `pnpm test:watch` | Vitest watch |
| `pnpm test:ci` | Vitest + coverage |
| `pnpm test:e2e` | Playwright (build + start test server) |
| `pnpm test:e2e:ci` | Seed test DB then Playwright (CI/local parity) |
| `pnpm test:e2e:local` | Playwright only (server already on :3000) |
| `pnpm seed:e2e` | Seed test DB (user, admin, name, descriptions) |
| `pnpm seed:e2e-user` | Alias for `seed:e2e` |
| `pnpm build:e2e` | Production build with E2E client flags |
| `pnpm start:e2e` | Start server against `MONGODB_URI_TEST` |

## Before merge (automated)

**GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push:

| Job | When | Steps |
|-----|------|--------|
| `fast` | Every push / PR | `pnpm lint`, `pnpm test:ci`, `pnpm build` |
| `e2e` | Push to `main` or pull request | MongoDB replica set (`docker run … --replSet rs0`) → `pnpm test:e2e:ci` (seed + Playwright) |

**CI artifacts** (uploaded with `if: always()` so green runs leave a baseline; retention controls storage cost):

| Artifact | Job | Retention | Contents |
|----------|-----|-----------|----------|
| `vitest-coverage-*` | `fast` | 7 days | Vitest coverage report (`coverage/`) |
| `playwright-report-*` | `e2e` | 7 days | HTML report (timings, retries) — small, always useful |
| `playwright-test-results-*` | `e2e` | 14 days | JUnit XML, traces (`on-first-retry`), screenshots/videos (`only-on-failure` / `retain-on-failure`); empty on a clean green run |

Playwright payload size is controlled in [`playwright.config.ts`](playwright.config.ts), not by gating the upload step behind `if: failure()`.

CI uses fixed test credentials (`e2e-ci@example.com`) and a fresh MongoDB container each run — no Atlas secret required. Optional: **Settings → Branches → `main`** → require status checks `fast` and `e2e` (pull requests not required if you push directly to `main`).

Local parity with the E2E job:

```bash
pnpm seed:e2e && CI=1 pnpm test:e2e
# or
CI=1 pnpm test:e2e:ci
```

Manual pre-push (without waiting for Actions):

```bash
pnpm test
pnpm build
pnpm test:e2e        # needs: playwright install, seed:e2e, MONGODB_URI_TEST in .env
```

Vitest + E2E green covers validation logic and the flows listed below. Manual checks on **dev** (`MONGODB_URI`) are only for what automation skips.

### Unit + component (Vitest / RTL)

| Area | Tests |
|------|-------|
| API auth guards | `checkOwnership.test.ts`, `checkIfAdmin.test.ts`, `getSessionForApis.test.ts`, `lib/auth.test.ts` (callbacks + credentials `authorize`; `resolveSignInCallback.test.ts` for signIn branching) |
| Password reset + auth update | `passwordResetToken.test.ts`, `authPasswordResetUpdate.test.ts`, `app/api/auth/update/route.test.ts` (validation, session vs token reset branch) |
| Like toggle rate limit | `likeToggleRateLimit.test.ts` (wraps `rateLimiter`; E2E strict header + 429 response shape) |
| ObjectId conversion | `convertStringToMongooseId.test.ts` |
| User likes prefetch | `getUserLikes.test.ts`, `LikesContext.test.tsx` (SSR hydrate, fetch, logout) |
| Notifications context | `notificationsContext.test.tsx` (fetch counts, logout clear, `resetNotificationType` PATCH) |
| Client cooldown | `useLocalStorageCooldown.test.ts` (localStorage gate, trigger, countdown) |
| Moderation dialog hooks | `useSuggest.test.ts`, `useFlagging.test.ts` (open/close state) |
| Notifications infinite SWR | `useSwrSimple.test.ts` (`getKey` when disabled/at end, flatten pages, `SWRisReachingEnd`, `fallbackData`) |
| Listing SWR pagination | `useSwrPagination.test.ts` (`buildSwrPaginationGetKey`, `swrPaginationFetcher` GET/POST, liked-names skip, flatten + totals) |
| Delete confirmation | `useDeleteConfirmation.test.ts` (SWR optimistic updater, `setLocalData` standalone mode, revalidate, rollback on failure) |
| Like toggle hook | `useLikeState.test.ts` (optimistic count, rollback; mocked `useToggleState`); `useToggleState.test.ts` (debounce POST, rollback, rate limit, in-flight guard); `useApiRateLimiter.test.ts` (limit, window reset) |
| Shared actions | `Shared/actions/GeneralButton.test.tsx` |
| Alert / validation UI | `Shared/feedback/WarningMessage.test.tsx`, `Shared/feedback/ToggeableAlert.test.tsx` |
| Form / gate UI | `Shared/feedback/MustLoginMessage.test.tsx`, `StyledCheckbox.test.tsx`, `preserveTextAfterSubmission.test.tsx` |
| Duplicate check UI | `CheckIfContentExists.test.tsx` (mocked `fetch` + `ContentListing`) |
| Blocklist API shape | `checkMultipleBlocklists.test.ts` (`blockedBy` on 403) |
| Default avatar util | `chooseRandomDefaultAvatar.test.ts` |
| Register form | `RegisterForm.test.tsx` (client validation + server field errors; mocked auth/captcha/axios) |
| Presentational | `Shared/ui/skeleton.test.tsx`, `Shared/media/ShowTime.test.tsx`, `Shared/lists/ListWithPawPrintIcon.test.tsx` |

RTL pattern: small harness with `useState` for dismiss flows; `userEvent` for clicks. API guards mock `getSessionForApis` via `vi.hoisted` (avoids loading `lib/auth` / Mongo). `CheckIfContentExists` harness restores parent `value` after the component’s mount `resetTrigger` effect clears it. `LikesContext` uses ref-based maps — tests capture `useLikes()` API imperatively and poll for async fetch (mutations do not re-render consumers).

---

## E2E (Playwright)

Runs against **`MONGODB_URI_TEST`**. Captcha and Resend are bypassed (`E2E_TEST_MODE` / `NEXT_PUBLIC_E2E_TEST_MODE` at build). **Do not duplicate these in manual testing.**

### Setup

```bash
pnpm exec playwright install   # once
# .env: MONGODB_URI_TEST, PLAYWRIGHT_TEST_EMAIL, PLAYWRIGHT_TEST_PASSWORD, NEXTAUTH_URL=http://localhost:3000
# optional: PLAYWRIGHT_TEST_ADMIN_EMAIL/PASSWORD (defaults in e2e/fixtures/seed-data.json)
pnpm seed:e2e                  # once — content from e2e/fixtures/seed-data.json
pnpm test:e2e
```

Playwright maps `MONGODB_URI_TEST` → `MONGODB_URI` when starting the server. `NEXTAUTH_SECRET` can match dev.

**E2E-only test hooks** (`E2E_TEST_MODE` — 404 in production):

| Route | Purpose |
|-------|---------|
| `POST /api/test/e2e/reset-thanks` | Delete thanks for a content item (`contentType`, `contentId`) — avoids 10-thanks cap on serial reruns |
| `POST /api/test/e2e/reset-contact-rate-limit` | Clear in-memory contact rate limit (shared singleton across server actions + API routes) |
| `POST /api/test/e2e/reset-like-toggle-rate-limit` | Clear like-toggle rate limit for current session |
| `POST /api/test/e2e/set-password-reset-token` | Set reset token on user (`email`, optional `expired: true`) |
| `POST /api/test/e2e/set-user-status` | Ban/unban user mid-session |

Re-run `pnpm seed:e2e` before a full suite if thanks caps, tags, or listing pagination counts drift after many local runs.

**CI build placeholders** (in [`.github/workflows/ci.yml`](.github/workflows/ci.yml), not GitHub Secrets): `RESEND_API_KEY` / `RESEND_EMAIL_FROM` are dummy values so `new Resend()` at import time in `lib/auth` does not fail during `pnpm build`. `NEXT_PUBLIC_BASE_FETCH_URL` is set for profile links in E2E builds. E2E mode skips real email sends; production keys stay in Vercel only.

**CI MongoDB:** E2E job uses a single-node replica set (`--replSet rs0`) because `togglelike` routes use Mongoose transactions (Atlas works locally; plain `mongo:7` service does not).

**Slow runs:** `pnpm test:e2e` runs `build && start` (~3–6 min). If port 3000 is busy, use `pnpm build:e2e && pnpm start:e2e` then `pnpm test:e2e:local`.

### What E2E covers

**`e2e/browse.spec.ts`**

- `/fetchnames` loads (no 500)
- `/fetchdescriptions` loads (no 500)
- `POST /api/names/swr` — `_id` values are strings; no `__v`
- `POST /api/description/swr` — same `_id` / `__v` shape
- `/name/[name]` — seeded name, creator profile, seeded tag `#e2e-name-tag`
- `/description/[id]` — seeded content, creator profile, seeded tag `#e2e-filter-tag`

**`e2e/landing-videos.spec.ts`**

- `/` — Fun / Impactful / Fitting buttons each open `youtube-nocookie.com` iframe with expected `embedId` and `title`
- Iframe `onLoad` reveals embed + close button (YouTube stubbed in test)
- Close X and toggle-click hide embed; only one video open at a time
- **Embed network** (no stub) — opening a video requests real `youtube-nocookie.com/embed/{id}` URL

**`e2e/data-shape.spec.ts`**

- `GET` name/description `check-if-content-exists` — string `_id` on document, `createdBy`, tags; no `__v`
- `GET /api/user/likes` — `id` and `contentId` are strings; no `__v`
- `GET /api/notifications/names|descriptions|thanks` — populated nested `_id` strings; no `__v` (serial; admin action + user fetch)

**`e2e/blocklist-api.spec.ts`**

- `POST /api/names` with exact blocklisted name → 403 + `blockedBy`
- `POST /api/description` with blocklisted substring → 403 + `blockedBy`

**`e2e/moderation.spec.ts`**

- Admin `POST /api/suggestion` on user-owned name → 201 (or idempotent skip if pending)
- Self-suggestion on own name → 400
- User `POST /api/flag/flagreportsubmission` on admin-owned name → 201 (or idempotent skip)
- Self-report on own name → 400
- Unauthenticated suggestion → 401 (names + descriptions)
- Unauthenticated report → 401 (names + descriptions)
- Same flows for user-owned / admin-owned **descriptions** (`SEED_DESCRIPTION_START` / `SEED_DESCRIPTION_ADMIN`)

**`e2e/contact.spec.ts`**

- Form fields and English/Spanish rule visible
- Too-fast submit → rejected
- Japanese message → rejected
- Spanish message → allowed (validation passes)
- Gibberish spam message → rejected
- Gibberish spam name → rejected
- Legitimate long name (Wojciechowski) → allowed
- Rate limit → 4th submit blocked

**`e2e/register.spec.ts`**

- Duplicate `PLAYWRIGHT_TEST_PROFILENAME` → rejected (new email, seeded user owns profile name)
- Duplicate seeded email → rejected (new profile name)
- Successful registration → `profileImage` is one of `DEFAULT_AVATARS` (`chooseRandomDefaultAvatar`)

**`e2e/profile-bio.spec.ts`**

- `PUT /api/user/editbiolocationavatar` with blocklisted bio → 403 + `blockedBy` in JSON
- Profile edit UI — blocklisted bio → server message in error toast
- `PUT /api/user/editbiolocationavatar` with blocklisted location → 403 + `blockedBy` in JSON
- Profile edit UI — blocklisted location → server message in error toast
- API + UI — valid bio saves and appears on `/profile/[profilename]` (lookup + About text)
- API + UI — location saves and appears on profile page (lookup + location row)

**`e2e/login.spec.ts`**

- Login page UI (magic link section, register link)
- Wrong password → error, stay on `/login`
- Banned account credentials → ban error toast, stay on `/login` (seeded `e2e-banned@example.com`)
- `/login?error=Banned` → ban toast (signIn redirect path)
- `/login?error=UserNotFound` → user not found toast (credentials signIn redirect)
- `/login?error=DBUnavailable` → database unavailable toast
- Magic link `POST /api/auth/signin/email` for banned email → redirect `?error=Banned`
- Magic link form (valid seeded email) → `/magiclink?email=…` confirmation page
- Credentials login → logged-in nav (profile menu)

**`e2e/addnames.spec.ts`**

- Logged-out → sign-in gate, disabled input/submit
- Invalid `@` in name → client-side warning
- Submit unique name → success toast
- Duplicate of seeded name (`SEED_NAME_DUPLICATE_VARIANT`) → 409
- Duplicate when spaces/punctuation differ (`E2E Seed Name`, `E2E-Seed!Name`) → 409 on submit + check-if-exists search
- Seeded name → `/name/[name]` loads
- Blocklisted name `butt` alone → rejected
- `fluffy butt` → allowed (blocklisted word not alone)
- Created name → `/name/[name]` loads
- Name with seeded tag (`e2e-name-tag` via tags cheat sheet) → `#e2e-name-tag` on `/name/[name]` (requires `pnpm seed:e2e` before E2E server start)

**`e2e/adddescriptions.spec.ts`**

- Logged-out → sign-in gate, disabled textarea
- Submit unique description → success toast; `/description/[id]` loads
- Blocklisted substring in description → rejected
- “Check if exists” at **start** of seeded description → duplicate shown
- Same UI — seeded **middle-only** marker → not flagged
- Description with seeded tag (`e2e-filter-tag` via tags cheat sheet) → `#e2e-filter-tag` on `/description/[id]` (after `pnpm seed:e2e`)

**`e2e/auth-session.spec.ts`**

- Logged-out `/dashboard` → redirect to `/login`
- Logged-in `/dashboard` and `/notifications` load
- `/profile/[profilename]` loads for seeded user
- Profile menu → Profile link visible
- Sign out → login again → session restored
- Mid-session ban (`POST /api/test/e2e/set-user-status`) → `/api/auth/session` null → reload → `/login`
- Mid-session unban after ban → sign-in with credentials works again

**`e2e/editsettings.spec.ts`**

- Clear name → client validation error (`Please enter a name`)
- Update display name → `PUT /api/auth/update` 200, success toast, persists on profile + API lookup
- Update password via settings form → success toast, login with new password works, old password rejected

**`e2e/admin.spec.ts`**

- Regular user — no Admin nav; category API → 403
- Admin — Admin menu links; can create name category via API

**`e2e/admin-category-ui.spec.ts`**

- Admin — `POST /api/namecategories` via `/addnamecategory` form → 201; category in `GET /api/namecategories`
- Admin — `POST /api/descriptioncategory` via `/adddescriptioncategory` form → 201; category in `GET /api/descriptioncategory`
- Admin — `POST /api/nametag` via `/addnametag` form → 201; tag in `GET /api/nametag` (no category attach)
- Admin — `POST /api/descriptiontag` via `/adddescriptiontag` form → 201; tag in `GET /api/descriptiontag` (no category attach)
- Admin — tag create + **category attach** via `StyledSelect` (react-select) → `POST` tag + `PUT` `edittags`; uses seeded categories `e2e name attach` / `e2e filter` (must exist before E2E server starts — run `pnpm seed:e2e` then `pnpm test:e2e`, not `test:e2e:local` against a stale server)

**`e2e/edits.spec.ts`**

- Owner updates seeded name notes (API + UI)
- Owner updates seeded description notes (UI)
- Owner attaches tag to seeded name/description via edit dialog (cheat sheet)
- Non-owner cannot edit admin-owned name → 403
- Edit description to duplicate another seeded entry → 409
- Owner edit (API + UI) preserves like count on name/description detail page (`likedByCount unchanged on owner edit`)

**`e2e/social.spec.ts`**

- Admin like → appears in user notifications API
- Self-like → excluded from notifications API
- Admin follow regular user via API
- `grabusersfollowing` lists followed users from Follow collection
- Name detail — rapid double-click like button → one debounced `togglelike` POST, no 5xx; count delta ≤ 1
- Name detail — like → pause 200ms → unlike → one POST after settle; heart and count return to initial
- `togglelike` — 4th POST with production rate limit (strict E2E header) → 429 + `retryAfterSeconds`

**`e2e/notifications.spec.ts`**

- Unauthenticated `GET` on names / descriptions / thanks → 401
- Name notifications — `likedBy` and `contentId` populated (not bare ids; regression for populate model imports)
- Description notifications — same populate shape after admin like
- Thank notifications — admin `POST /api/thanks` on seeded name/description → user `GET /api/notifications/thanks` has populated `thanksBy` + content
- Self-thank — `POST /api/thanks` on own content → 400
- `PATCH /api/notifications/thanks/mark-read` → all thank notifications `read: true`
- `PATCH /api/notifications/names/mark-read` → all name like notifications `read: true`
- `PATCH /api/notifications/descriptions/mark-read` → all description like notifications `read: true`

**`e2e/notifications-ui.spec.ts`**

- Thanks tab — admin thanks seeded name → row shows thanker name, message, and `SEED_NAME`
- Thanks tab — unread badge clears after tab stays open (~3s mark-read timer); **persists after page reload**
- Thanks tab — admin thanks seeded description → row shows truncated description text
- Descriptions tab — admin likes seeded description → row shows admin name + truncated content + `Liked •`
- Descriptions tab — unread badge clears after tab stays open (~3s mark-read timer); **persists after page reload**
- Names tab — admin likes seeded name → row shows admin name + `SEED_NAME` + `Liked •` (default tab on page load)
- Names tab — unread badge clears after tab stays open (~3s mark-read timer); **persists after page reload**

**`e2e/thanks-ui.spec.ts`**

- Name detail — admin submits thank via `ThanksButton` dialog → `POST /api/thanks` 2xx + success toast
- Notifications — content owner sees UI-submitted name thank on Thanks tab
- Name detail — content owner does not see Thank button (self-thank UI guard)
- Description detail — admin submits thank via dialog → owner sees row on Thanks tab

**`e2e/moderation-ui.spec.ts`**

- Name detail — user opens ⋮ menu → Suggestion on admin-owned name → add form submit or edit form if pending (idempotent via API check)
- Name detail — user opens ⋮ menu → Report on admin-owned name → Spam checkbox submit or edit form if pending
- Name detail — content owner ⋮ menu shows Delete only (no Suggestion/Report)
- Description detail — same Suggestion / Report / owner-menu flows on admin-owned and user-owned seeded descriptions

**`e2e/delete-content.spec.ts`**

- Owner creates unique name → deletes from `/name/[name]` via ⋮ menu → success toast, content shows `DELETED`, duplicate check no longer matches
- Owner creates unique description → deletes from `/description/[id]` via ⋮ menu → same success + duplicate check no longer matches

**`e2e/reset-password.spec.ts`**

- `/resetpassword/[token]` invalid token → error message, password fields disabled
- Expired token (E2E hook) → same error message, password fields disabled
- E2E token hook → reset form → auto sign-in → new password works on manual login

**`e2e/forgot-password.spec.ts`**

- `POST /api/forgotpassword` unknown email → 404
- UI unknown email → same non-enumeration success message (green alert)
- UI unknown + known email with stubbed 200 API → identical success copy
- `POST /api/forgotpassword` known seeded email → 200 (Resend skipped in E2E mode)
- UI known email via real API → non-enumeration success message

**`e2e/fetchname.spec.ts`**

- `/fetchname` — public page loads (`#checkExists`, Search button)
- Search seeded name → duplicate message + seeded content visible
- Search punctuation variant → duplicate message
- Search unique name → “not in the database” success message
- Invalid `@` character → warning + disabled Search

**`e2e/session-refresh.spec.ts`**

- `POST /api/auth/session/refresh` unauthenticated → 401
- After `PUT /api/user/editbiolocationavatar` → refresh returns updated `bio`
- After location save → refresh returns updated `location`
- After `PUT /api/auth/update` name change → refresh returns updated `name`

**`e2e/fetchnames-cooldown.spec.ts`**

- `/fetchnames` — sort dropdown change → ~3s cooldown (disabled select + wait option text)
- `/fetchnames` — filter quick apply → ~5s cooldown (`Wait Ns`, disabled apply/quick buttons)
- `/fetchnames` — pagination next at SWR chunk edge → ~15s cooldown (requires `pnpm seed:e2e` — 51+ names, second SWR chunk)

**`e2e/fetchdescriptions-cooldown.spec.ts`**

- `/fetchdescriptions` — sort dropdown change → ~3s cooldown (disabled select + wait option text)
- `/fetchdescriptions` — filter apply via seeded category/tag → ~5s cooldown (`wait N secs` apply button)
- `/fetchdescriptions` — pagination next at SWR chunk edge → ~15s cooldown (requires `pnpm seed:e2e` — 51+ descriptions, second SWR chunk)

**Note — duplicate notification rows (strict mode):** Serial reruns of `notifications-ui.spec.ts` leave multiple thank/like rows for the same seeded content in the test DB. A locator like `row.getByText('E2E Admin')` can then match two elements and Playwright throws a strict mode violation.

**Fix:** `notificationRow()` in [`e2e/helpers/notifications-ui.ts`](e2e/helpers/notifications-ui.ts) filters rows then uses `.first()`. Assertions use `toContainText` on that single row instead of nested `getByText`.

Re-run (no re-seed required; duplicate rows are expected and handled):

```bash
pnpm test:e2e e2e/notifications-ui.spec.ts
```

### Fixture data

Shared seed content lives in **`e2e/fixtures/seed-data.json`** (imported by `scripts/seed-e2e.mjs` and Playwright via `e2e/fixtures/seed-data.ts`). Tests use constants like `SEED_NAME` — not hardcoded strings — so duplicate checks stay in sync with the DB.

**Listing cooldown seed** (`listingCooldown` in `seed-data.json`): bulk names/descriptions (51+ total each), description filter category `e2e filter` + tag `e2e-filter-tag`, name category `e2e name attach` with tag `e2e-name-tag` (add-names + react-select attach tests). Re-run `pnpm seed:e2e` after changing fixture counts. Root layout caches categories for 3 hours in-process — tag picker tests need categories/tags present when the test server starts.

### Where tests live

- Unit: `*.test.ts` next to modules
- E2E: `e2e/*.spec.ts`
- E2E fixtures: `e2e/fixtures/`
- Notes: [docs/notes/](docs/notes/)

---

## Manual verification (dev only)

Use **`pnpm dev`** against your normal **`MONGODB_URI`**. The **E2E section above** is the tier-2 backlog — do **not** re-run those flows manually unless debugging a failure.

Checkboxes below are for **dev-only** work automation cannot do (real captcha, email, blocked features).

### Real captcha & email (cannot E2E)

- [ ] **Contact happy path** — `/contact`, wait **>3s**, complete **real reCAPTCHA**, submit → success toast or email (Resend configured)
- [ ] **Register** — `/register` with real reCAPTCHA → new user, default avatar (`chooseRandomDefaultAvatar`)
- [ ] **Magic link — request** — `/login` request link → email arrives (skip if Resend not configured)
- [ ] **Magic link — sign in** — click link → logged in; refresh keeps session

### Optional visual check

- [ ] **Nav** — avatar image detail (pixel/layout)

### Blocked on product (not manual yet)

| Item | Why |
|------|-----|
| Admin — **edit** existing category/tag in UI | No edit routes; create is E2E’d in `e2e/admin-category-ui.spec.ts` |
| Profile **follow / unfollow** via UI | Modals commented out — see [`docs/FUTURE.md`](docs/FUTURE.md); API follow in `e2e/social.spec.ts` |

### Optional future E2E

All items from this list are now covered in Playwright (see specs above).

### Tier-2 backlog — automated (reference only)

These manual checklist items are **done in Playwright**; see spec files in [What E2E covers](#what-e2e-covers).

| Area | Primary specs |
|------|----------------|
| Auth & bans | `login.spec.ts`, `auth-session.spec.ts` |
| Admin create UI | `admin.spec.ts`, `admin-category-ui.spec.ts` |
| Add content + tags + normalization | `addnames.spec.ts`, `adddescriptions.spec.ts` |
| Edits + `likedByCount` | `edits.spec.ts` |
| Blocklist + bio + location | `profile-bio.spec.ts`, `blocklist-api.spec.ts` |
| Likes + follow API + rate limit | `social.spec.ts` |
| Notifications API + UI mark-read | `notifications.spec.ts`, `notifications-ui.spec.ts` |
| Thanks / suggestion / report | `thanks-ui.spec.ts`, `moderation.spec.ts`, `moderation-ui.spec.ts` |
| Owner delete content | `delete-content.spec.ts` |
| Reset password (token + new password login) | `reset-password.spec.ts` |
| Forgot password (non-enumeration UX) | `forgot-password.spec.ts` |
| Magic link confirmation UI | `login.spec.ts` |
| Data shape + detail pages | `browse.spec.ts`, `data-shape.spec.ts` |
| Listing cooldowns | `fetchnames-cooldown.spec.ts`, `fetchdescriptions-cooldown.spec.ts` |
| Register (captcha bypass) + default avatar | `register.spec.ts` |
| Landing videos (stubbed YouTube) | `landing-videos.spec.ts` |
| Edit settings | `editsettings.spec.ts` |
| Single name search (`/fetchname`) | `fetchname.spec.ts` |
| Session refresh after profile/settings DB change | `session-refresh.spec.ts` |
| Contact validation (no real captcha) | `contact.spec.ts` |

---

## Convert-then-test workflow (TS migration)

1. Convert file (`.js` → `.ts` / `.jsx` → `.tsx`)
2. Add unit tests if the module has pure logic
3. Add E2E only for stable user flows not needing captcha/email
4. `pnpm test` + `pnpm build`; `pnpm test:e2e` if you touched covered flows

Block high-risk areas (`lib/auth.ts`, rate limiter, ownership) without unit smoke tests. **`lib/auth.test.ts`**, **`getSessionForApis.test.ts`**, and **`resolveSignInCallback.test.ts`** cover auth guards; ownership/admin use mocked `getSessionForApis`.

---

## Regression signals

| Symptom | Likely cause |
|---------|----------------|
| 500 on page load | `db.connect` or `leanWithStrings` |
| Hydration / `[object Object]` in UI | ObjectId not stringified |
| Contact always fails on dev | Rate limiter, bot rules, or captcha keys |
| Login OK but nav logged out | `session` / `jwt` callback |
| `profileName` or `role` missing | NextAuth augmentation |
| Duplicate name slips through | `findExactNormalized` |
| Description duplicate check wrong | `findStartNormalized` / normalization |
| Pagination spam with no delay | `startCooldown` |
| Like toggle 500 | `NameLike` / transaction |
| Thank submit 500 | `Thank` model / enum mismatch |

---

## Where tests live

- Unit tests: co-located as `*.test.ts`
- Component tests: co-located as `*.test.tsx`
- E2E tests: `e2e/*.spec.ts`
- Design notes: [docs/notes/](docs/notes/) — see [docs/README.md](docs/README.md)
