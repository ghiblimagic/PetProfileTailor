# Testing

## Stack

- **Vitest** — unit tests (pure logic, no browser)
- **React Testing Library** — component tests
- **Playwright** — E2E on test DB (`MONGODB_URI_TEST`)

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm test` | Vitest once |
| `pnpm test:watch` | Vitest watch |
| `pnpm test:ci` | Vitest + coverage |
| `pnpm test:e2e` | Playwright (build + start test server) |
| `pnpm test:e2e:local` | Playwright only (server already on :3000) |
| `pnpm seed:e2e` | Seed test DB (user, admin, name, descriptions) |
| `pnpm seed:e2e-user` | Alias for `seed:e2e` |
| `pnpm build:e2e` | Production build with E2E client flags |
| `pnpm start:e2e` | Start server against `MONGODB_URI_TEST` |

## Before merge (automated)

```bash
pnpm test
pnpm test:e2e        # needs: playwright install, seed:e2e, MONGODB_URI_TEST in .env
pnpm build
```

Vitest + E2E green covers validation logic and the flows listed below. Manual checks on **dev** (`MONGODB_URI`) are only for what automation skips.

### Unit + component (Vitest / RTL)

| Area | Tests |
|------|-------|
| API auth guards | `checkOwnership.test.ts`, `checkIfAdmin.test.ts`, `getSessionForApis.test.ts`, `lib/auth.test.ts` (callbacks + credentials `authorize`; `resolveSignInCallback.test.ts` for signIn branching) |
| User likes prefetch | `getUserLikes.test.ts`, `LikesContext.test.tsx` (SSR hydrate, fetch, logout) |
| Notifications context | `notificationsContext.test.tsx` (fetch counts, logout clear, `resetNotificationType` PATCH) |
| Client cooldown | `useLocalStorageCooldown.test.ts` (localStorage gate, trigger, countdown) |
| Moderation dialog hooks | `useSuggest.test.ts`, `useFlagging.test.ts` (open/close state) |
| Notifications infinite SWR | `useSwrSimple.test.ts` (`getKey` when disabled/at end, flatten pages, `SWRisReachingEnd`, `fallbackData`) |
| Like toggle hook | `useLikeState.test.ts` (optimistic count, rollback; mocked `useToggleState`); `useToggleState.test.ts` (debounce POST, rollback, rate limit, in-flight guard); `useApiRateLimiter.test.ts` (limit, window reset) |
| Shared actions | `Shared/actions/GeneralButton.test.tsx` |
| Alert / validation UI | `Shared/feedback/WarningMessage.test.tsx`, `Shared/feedback/ToggeableAlert.test.tsx` |
| Form / gate UI | `Shared/feedback/MustLoginMessage.test.tsx`, `StyledCheckbox.test.tsx`, `preserveTextAfterSubmission.test.tsx` |
| Duplicate check UI | `CheckIfContentExists.test.tsx` (mocked `fetch` + `ContentListing`) |
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

**Slow runs:** `pnpm test:e2e` runs `build && start` (~3–6 min). If port 3000 is busy, use `pnpm build:e2e && pnpm start:e2e` then `pnpm test:e2e:local`.

### What E2E covers

**`e2e/browse.spec.ts`**

- `/fetchnames` loads (no 500)
- `/fetchdescriptions` loads (no 500)
- `POST /api/names/swr` — `_id` values are strings; no `__v`
- `/name/[name]` — seeded name + creator profile render
- `/description/[id]` — seeded description content renders

**`e2e/moderation.spec.ts`**

- Admin `POST /api/suggestion` on user-owned name → 201 (or idempotent skip if pending)
- Self-suggestion on own name → 400
- User `POST /api/flag/flagreportsubmission` on admin-owned name → 201 (or idempotent skip)
- Self-report on own name → 400
- Unauthenticated suggestion → 401

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

**`e2e/login.spec.ts`**

- Login page UI (magic link section, register link)
- Wrong password → error, stay on `/login`
- Credentials login → logged-in nav (profile menu)

**`e2e/addnames.spec.ts`**

- Logged-out → sign-in gate, disabled input/submit
- Invalid `@` in name → client-side warning
- Submit unique name → success toast
- Duplicate of seeded name (`SEED_NAME_DUPLICATE_VARIANT`) → 409
- Seeded name → `/name/[name]` loads
- Blocklisted name `butt` alone → rejected
- `fluffy butt` → allowed (blocklisted word not alone)
- Created name → `/name/[name]` loads

**`e2e/adddescriptions.spec.ts`**

- Logged-out → sign-in gate, disabled textarea
- Submit unique description → success toast; `/description/[id]` loads
- Blocklisted substring in description → rejected
- “Check if exists” at **start** of seeded description → duplicate shown
- Same UI — seeded **middle-only** marker → not flagged

**`e2e/auth-session.spec.ts`**

- Logged-out `/dashboard` → redirect to `/login`
- Logged-in `/dashboard` and `/notifications` load
- `/profile/[profilename]` loads for seeded user
- Profile menu → Profile link visible
- Sign out → login again → session restored

**`e2e/editsettings.spec.ts`**

- Clear name → client validation error (`Please enter a name`)

**`e2e/admin.spec.ts`**

- Regular user — no Admin nav; category API → 403
- Admin — Admin menu links; can create name category via API

**`e2e/admin-category-ui.spec.ts`**

- Admin — `POST /api/namecategories` via `/addnamecategory` form → 201; category in `GET /api/namecategories`
- Admin — `POST /api/descriptioncategory` via `/adddescriptioncategory` form → 201; category in `GET /api/descriptioncategory`

**`e2e/edits.spec.ts`**

- Owner updates seeded name notes (API + UI)
- Non-owner cannot edit admin-owned name → 403
- Edit description to duplicate another seeded entry → 409

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

**`e2e/fetchnames-cooldown.spec.ts`**

- `/fetchnames` — sort dropdown change → ~3s cooldown (disabled select + wait option text)
- `/fetchnames` — filter quick apply → ~5s cooldown (`Wait Ns`, disabled apply/quick buttons)
- `/fetchnames` — pagination next at SWR chunk edge → ~15s cooldown — **skipped** when test DB has &lt; 51 names (seed-only DB)

**Note — duplicate notification rows (strict mode):** Serial reruns of `notifications-ui.spec.ts` leave multiple thank/like rows for the same seeded content in the test DB. A locator like `row.getByText('E2E Admin')` can then match two elements and Playwright throws a strict mode violation.

**Fix:** `notificationRow()` in [`e2e/helpers/notifications-ui.ts`](e2e/helpers/notifications-ui.ts) filters rows then uses `.first()`. Assertions use `toContainText` on that single row instead of nested `getByText`.

Re-run (no re-seed required; duplicate rows are expected and handled):

```bash
pnpm test:e2e e2e/notifications-ui.spec.ts
```

### Fixture data

Shared seed content lives in **`e2e/fixtures/seed-data.json`** (imported by `scripts/seed-e2e.mjs` and Playwright via `e2e/fixtures/seed-data.ts`). Tests use constants like `SEED_NAME` — not hardcoded strings — so duplicate checks stay in sync with the DB.

### Where tests live

- Unit: `*.test.ts` next to modules
- E2E: `e2e/*.spec.ts`
- E2E fixtures: `e2e/fixtures/`
- Notes: [docs/notes/](docs/notes/)

---

## Manual verification (dev only)

Use **`pnpm dev`** against your normal **`MONGODB_URI`**. Run the sections that match your PR — skip anything already in the E2E table above.

**Note:** Checkboxes are personal progress; preserve them when editing.

### Captcha, email, and real third-party services

E2E cannot exercise these (bypassed or skipped).

- [ ] **Contact happy path** — `/contact`, wait **>3s**, complete **real reCAPTCHA**, submit → success toast or email (Resend configured)
- [ ] **Register** — `/register` with real reCAPTCHA → new user, default avatar
- [ ] **Magic link** — `/login` request link → email arrives (skip if Resend not configured)
- [ ] **Magic link** — click link → logged in; refresh keeps session

### Auth & session (beyond E2E)

- [ ] Nav — avatar image detail (pixel/layout)
- [ ] Optional: banned account → ban error; mid-session ban + refresh → logged out

### Admin UI depth

- [ ] Admin — create tag/category via **UI** (not just API smoke) — **partial:** name + description category create — `e2e/admin-category-ui.spec.ts`; nav links — `e2e/admin.spec.ts`
- [ ] Admin — edit existing category/tag in UI

### Content depth (tags, normalization)

- [ ] `/addnames` — name with **tags** → appears on `/name/[name]` with tags/categories
- [ ] Name normalization — spaces/punctuation/case variants → same duplicate behavior (UI search/add flows beyond case duplicate)
- [ ] Edit own content → `likedByCount` unchanged unless liking

### Blocklist (bio and API detail)

- [ ] `/register` or profile bio — blocklisted bio → rejected (if field checked)
- [ ] DevTools — blocklist 403 responses include `blockedBy` (E2E asserts message only)

### Social & notifications (beyond E2E API smoke)

- [ ] Like toggle on name detail UI — rapid double-click → one like, no 500 — **E2E:** `e2e/social.spec.ts` (burst + like/unlike settle); behavior documented in [`togglelike-route.md`](docs/notes/app/api/togglelike-route.md)
- [ ] `/notifications` **UI** — mark read persists — **partial:** thanks + names tab badges covered in `notifications-ui.spec.ts` (reload after mark-read)
- [ ] Profile follow / unfollow via **UI** — **deferred:** followers/following modals commented out on profile; track in [`docs/FUTURE.md`](docs/FUTURE.md) (re-enable UI, then Playwright on `FollowButton`)
- [ ] Thank, suggestion, report flows — submit without 500; lists load if exposed — **partial:** thank UI — `e2e/thanks-ui.spec.ts`; suggestion/report API — `e2e/moderation.spec.ts`; suggestion/report UI — `e2e/moderation-ui.spec.ts`

### Data shape & listing UX

- [ ] DevTools → Network — other APIs (`leanWithStrings`) still return string `_id`; no `__v`
- [ ] `/name/[name]`, `/description/[id]` — render with related data (tags, creator) — **partial:** `e2e/browse.spec.ts` (name + description detail smoke)
- [ ] `/fetchnames` or `/fetchdescriptions` — pagination spam **next** → ~15s cooldown — **partial:** sort + filter cooldown UI — `e2e/fetchnames-cooldown.spec.ts`; pagination cooldown skips when DB &lt; 51 names
- [ ] Same pages — rapid sort/filter → ~3s cooldown — **partial:** `e2e/fetchnames-cooldown.spec.ts`
- [ ] `useApiRateLimiter` / like button — rapid clicks throttled — **unit:** `useApiRateLimiter.test.ts`; UI double-click E2E still open

### Misc utils (no E2E yet)

- [ ] `/register` — full signup with real captcha → default avatar assigned (`chooseRandomDefaultAvatar`)

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
