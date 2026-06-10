# Testing

## Stack

- **Jest** — unit tests (pure logic, no browser)
- **React Testing Library** — component tests
- **Playwright** — E2E on test DB (`MONGODB_URI_TEST`)

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm test` | Jest once |
| `pnpm test:watch` | Jest watch |
| `pnpm test:ci` | Jest + coverage |
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

Jest + E2E green covers validation logic and the flows listed below. Manual checks on **dev** (`MONGODB_URI`) are only for what automation skips.

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

**`e2e/browse.spec.ts`** (also page load above)

- `POST /api/names/swr` — `_id` values are strings; no `__v`

**`e2e/admin.spec.ts`**

- Regular user — no Admin nav; category API → 403
- Admin — Admin menu links; can create name category via API

**`e2e/edits.spec.ts`**

- Owner updates seeded name notes (API + UI)
- Non-owner cannot edit admin-owned name → 403
- Edit description to duplicate another seeded entry → 409

**`e2e/social.spec.ts`**

- Admin like → appears in user notifications API
- Self-like → excluded from notifications API
- Admin follow regular user via API
- `grabusersfollowing` lists followed users from Follow collection

**`e2e/notifications.spec.ts`**

- Unauthenticated `GET` on names / descriptions / thanks → 401
- Name notifications — `likedBy` and `contentId` populated (not bare ids; regression for populate model imports)
- Description notifications — same populate shape after admin like
- `PATCH /api/notifications/names/mark-read` → all name like notifications `read: true`

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

- [ ] Admin — create tag/category via **UI** (not just API smoke)
- [ ] Admin — edit existing category/tag in UI

### Content depth (tags, normalization)

- [ ] `/addnames` — name with **tags** → appears on `/name/[name]` with tags/categories
- [ ] Name normalization — spaces/punctuation/case variants → same duplicate behavior (UI search/add flows beyond case duplicate)
- [ ] Edit own content → `likedByCount` unchanged unless liking

### Blocklist (bio and API detail)

- [ ] `/register` or profile bio — blocklisted bio → rejected (if field checked)
- [ ] DevTools — blocklist 403 responses include `blockedBy` (E2E asserts message only)

### Social & notifications (beyond E2E API smoke)

- [ ] Like toggle on name detail UI — rapid double-click → one like, no 500
- [ ] `/notifications` **UI** — mark read persists (E2E covers names mark-read **API** only)
- [ ] `/notifications` UI — description and thanks tabs render populated rows
- [ ] Profile follow / unfollow via **UI** (followers list is commented out on profile)
- [ ] **Thanks** notifications — submit thank via UI/API → appears in `/api/notifications/thanks` (no E2E yet)
- [ ] Thank, suggestion, report flows — submit without 500; lists load if exposed

### Data shape & listing UX

- [ ] DevTools → Network — other APIs (`leanWithStrings`) still return string `_id`; no `__v`
- [ ] `/name/[name]`, `/description/[id]` — render with related data (tags, creator)
- [ ] `/fetchnames` or `/fetchdescriptions` — pagination spam **next** → ~15s cooldown
- [ ] Same pages — rapid sort/filter → ~3s cooldown
- [ ] `useApiRateLimiter` / like button — rapid clicks throttled

### Misc utils (no E2E yet)

- [ ] `/register` — full signup with real captcha → default avatar assigned (`chooseRandomDefaultAvatar`)

---

## Convert-then-test workflow (TS migration)

1. Convert file (`.js` → `.ts` / `.jsx` → `.tsx`)
2. Add unit tests if the module has pure logic
3. Add E2E only for stable user flows not needing captcha/email
4. `pnpm test` + `pnpm build`; `pnpm test:e2e` if you touched covered flows

Block high-risk areas (`lib/auth.ts`, rate limiter, ownership) without unit smoke tests.

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
