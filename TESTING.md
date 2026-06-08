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

### Manual checks (oldest → newest)

Work through in order for a **full migration smoke**. For a single PR, jump to the section that matches your change.

---

#### 1. Wave 1 — leaf utils (2026-06-02)

Code touched: `fetch`, `error`, `normalizeString`, `debounce`, `checkIfValidContentType`, hooks, etc.

- [ ] `chooseRandomDefaultAvatar` — `/register` new user → default profile avatar assigned
- [ ] `getError` — `/editsettings` → trigger validation error → message still displays
- [ ] `useApiRateLimiter` + `debounce` — toggle/cooldown buttons → rapid clicks throttled
- [ ] `checkIfValidContentType` — `/fetchnames` / `/fetchdescriptions` listing pages load via SWR/API

---

#### 2. Cumulative quick pass (2026-06-03 — general smoke, ~15–20 min)

Broad sanity check after early migration waves.

- [ ] `/fetchnames` — name list loads
- [ ] One `/name/[name]` page — content, tags, categories render
- [ ] One `/profile/[profilename]` page — user data and lists load
- [ ] Log in → `/notifications` — tabs and notification items load
- [ ] `/contact` — one legitimate submit (wait **>3 seconds** before clicking submit)
- [ ] `/contact` — one obvious spam submit (gibberish name or message) → rejected
- [ ] One owner action (edit your own content) — still works
- [ ] Rapid-click a rate-limited button (like/follow) — throttles, no double submit

---

#### 3. Wave 2 — `mongoDataCleanup` + `db` (2026-06-06)

Code touched: `utils/db.ts`, `leanWithStrings`. Regressions: **500**, blank sections, `[object Object]` IDs.

- [ ] `/fetchnames` — list loads; no server error
- [ ] `/name/[name]` — page renders with related data
- [ ] `/description/[id]` — content loads
- [ ] `/profile/[profilename]` — profile, lists, images load
- [ ] `/dashboard` (logged in) — dashboard data renders
- [ ] `/notifications` (logged in) — like/thank items show linked content
- [ ] DevTools → Network → data API responses: `_id` values are **strings**; no `__v` in JSON

**Network tip:** string IDs mean `leanWithStrings` is working.

---

#### 4. Contact spam + rate limiter (2026-06-02)

Code touched: `detectBotPatterns`, `rateLimiter` on `/contact`.

- [ ] Happy path — real name + normal message; wait **>3s** before submit → success (or email if Resend configured)
- [ ] Gibberish name — 19+ letter token (e.g. `abcdefghijklmnopqrst`) → rejected
- [ ] Gibberish message — long random / spam-like text → rejected
- [ ] Legitimate long name — e.g. `Wojciechowski` + normal message → allowed
- [ ] Rate limit — two submits from same IP within preset window → second blocked
- [ ] Non-English message — e.g. Chinese inquiry text → allowed

---

#### 5. Wave 2 — auth guards (2026-06-02)

Code touched: `checkIfAdmin`, `checkOwnership`, `getSessionForApis`. See **§7** for full login/session smoke after `lib/auth.ts`.

- [ ] Admin — edit category/tag as admin → works
- [ ] Admin — same action as non-admin → 401/403, not 500
- [ ] Edit own content → saves
- [ ] Edit others' content → blocked cleanly (403/401, not 500)

---

#### 6. Name normalization (2026-06-02)

Code touched: `normalizeString` (duplicate detection, check-if-exists).

- [ ] Create or search with spaces/punctuation/case variants → same normalized match as before
- [ ] Duplicate name on `/addnames` → still caught

---

#### 7. Auth + `User` model (2026-06-07 — `b1f0994`, ~15 min)

Code touched: `lib/auth.ts`, `models/User.ts`, `types/next-auth.d.ts`, `resolveSignInCallback`.

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

---

#### 8. Utils wave 3 (2026-06-07 — `b29c9e7`, ~10 min)

Code touched: `getUserByProfileName.ts`, `startCooldown.ts`, `findNormalizedMatch.ts`.

- [ ] `/profile/[profilename]` — known user's profile loads (avatar, lists; not 404/500)
- [ ] `/register` with taken profile name → rejected
- [ ] `/addnames` — duplicate name (`Fluffy` when `fluffy` exists) → 409 / “already exists”
- [ ] Edit description to text matching another entry → duplicate blocked
- [ ] `/adddescriptions` → “Check if a description exists” → paste **start** of existing description → duplicate message + existing content shown
- [ ] Same UI, text matching only **middle** of existing description → **not** flagged as duplicate
- [ ] `/fetchnames` or `/fetchdescriptions` → spam pagination **next** → ~15s cooldown
- [ ] Same pages → rapid sort or filter changes → ~3s cooldown

**Note:** Name “check if exists” on `/fetchname` uses its own route, not `findNormalizedMatch`.

---

#### 9. `lib/checkBlocklist` (2026-06-07, ~5 min)

Code touched: `lib/checkBlocklist.ts`, `checkMultipleBlocklists.ts`, `data/blockList.js`.

- [ ] `/addnames` — submit **`butt`** alone → 403 / blocklist message (`exact-name`)
- [ ] `/addnames` — submit **`fluffy butt`** → allowed
- [ ] `/adddescriptions` — substring blocklist hit → 403 with `blockedBy` in message
- [ ] `/addnames` or `/adddescriptions` — legitimate content → saves successfully
- [ ] `/register` or `/editsettings` — blocklisted bio (if field checked) → rejected

**Note:** `/contact` uses `detectBotPatterns`, not `checkBlocklist`.

---

#### 10. Likes models (2026-06-07 — `NameLike` / `DescriptionLike`, ~10 min)

Code touched: `models/NameLike.ts`, `models/DescriptionLike.ts`. (`Follow.ts` — migrations only.)

Use **two users** (or like another user's content).

- [ ] Name like toggle on `/name/[name]` → like / unlike; count updates
- [ ] Rapid double-click like → one like only, no 500
- [ ] Description like toggle on `/description/[id]` → like / unlike works
- [ ] `/notifications` — names tab shows like from another user
- [ ] `/notifications` — descriptions tab shows like notification
- [ ] Mark like notification read → stays read on refresh
- [ ] User likes list loads (dashboard / likes view if exposed)
- [ ] Self-like → no notification for yourself
- [ ] Profile follow / unfollow still works (`User.followers`, not `Follow` model)

---

### Regression signals (all waves)

| Symptom | Likely cause |
|---------|----------------|
| 500 on page load | `db.connect` or `leanWithStrings` on that route |
| Hydration error / "Objects are not valid as React child" | ObjectId not stringified (`mongoDataCleanup`) |
| Contact always fails | Rate limiter or bot detection too aggressive |
| Admin/owner action returns 500 | `checkIfAdmin` / `checkOwnership` session handling |
| Login succeeds but nav shows logged out | `session` / `jwt` callback or `toTokenUser` |
| `profileName` or `role` missing in UI | NextAuth augmentation / JWT payload |
| Profile page 500 for valid user | `getUserByProfileName` or `db.connect` |
| Duplicate name slips through on submit | `findExactNormalized` |
| Description check never finds known duplicate | `findStartNormalized` / normalization |
| Pagination or sort spam works with no delay | `startCooldown` |
| All names/descriptions rejected | Blocklist Sets / Trie; `data/blockList.js` |
| `butt` alone allowed | exact-name pass broken or content length ≥ 100 |
| Obvious substring slips through | Trie or lowercasing on list entries |
| 500 instead of 403 on block | `respondIfBlocked` / `bannedWordsMessage` |
| Like toggle 500 | `NameLike` / `DescriptionLike` or toggle route transaction |
| Count wrong but no error | `likedByCount` out of sync with like collection |
| Notifications empty after like | `contentCreator` / populate / `getPaginatedNotifications` |
| Duplicate likes in DB | unique index missing on `namelikes` / `descriptionlikes` |

---

### Optional automated smoke

```bash
pnpm exec playwright install   # once
pnpm test:e2e                  # login page render only
```

E2E does not replace the manual checks above.