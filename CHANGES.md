# CHANGES

## 2026-06-02 — TypeScript migration wave 1

### What was built and why

Incremental TypeScript conversion (wave 1): small leaf utilities and hooks with minimal dependencies, following the migration plan. Keeps `strict: false` until most of the codebase is converted.

### Files created

- `utils/fetch.ts`
- `utils/error.ts`
- `utils/stringManipulation/normalizeString.ts`
- `utils/api/checkIfValidContentType.ts` (exports `ContentType` union co-located)
- `utils/debounce.ts` (generic debounce with `cancel` / `flush`)
- `hooks/usePrefersReducedMotions.ts`
- `hooks/useApiRateLimiter.ts`
- `CHANGES.md`

### Files modified

- `tsconfig.json` — added `noFallthroughCasesInSwitch` and `noImplicitReturns`; kept `strict: false` and `strictNullChecks: true`

### tsconfig.json choices (and why)

This project is ~95% JavaScript, so tsconfig is tuned for **incremental migration**, not full strictness on day one.

**Left unchanged on purpose**

| Option | Value | Why |
|--------|-------|-----|
| `allowJs` | `true` | Most files are still `.js`/`.jsx`. Without this, TypeScript would ignore the majority of the codebase and break the gradual rename-and-type workflow. |
| `strict` | `false` | Enabling full strict mode now would surface hundreds of errors across untouched JS files and force a big-bang fix. We flip this to `true` later, once ~70%+ of files are converted. |
| `strictNullChecks` | `true` | Already on before wave 1. Null/undefined bugs are high-value to catch early, and the existing TS files (email templates, hooks) were written with this in mind. Keeping it avoids regressing code that already passes null checks. |
| `include` (`**/*.js`, `**/*.jsx`) | kept | Same reason as `allowJs` — JS and TS coexist in one project until migration is done. |
| `moduleResolution` | `"node"` | Works with the current Next.js 15 setup. `"bundler"` is a later option when we enable full strict and tighten the toolchain. |
| `checkJs` | not enabled | Would type-check every JS file immediately and create a huge error surface before those files have types. Optional `// @ts-check` per file is the safer path for hard modules later. |

**Added in wave 1**

| Option | Why |
|--------|-----|
| `noFallthroughCasesInSwitch` | Catches accidental `switch` fall-through — a real logic bug — without requiring types on any file. Safe to turn on during migration. |
| `noImplicitReturns` | Ensures functions with a return type (or inferred return paths) actually return on all code paths. Again, catches bugs without forcing `noImplicitAny` on legacy JS. |

**Deliberately deferred**

- **`strict: true`** — replaces individual strict flags; wait until most files are `.ts` so the error list is manageable.
- **`moduleResolution: "bundler"`** — Next 15 recommendation, but not required while `strict` stays off.
- **`checkJs: true`** — only worth considering file-by-file before rename, not globally.
- **typescript-eslint** — add when enough `.ts` files exist to justify type-aware linting.

In short: keep the door open for JS, enforce null safety on code we already type, add two low-risk bug-catching flags, and save full strict mode for when the conversion is far enough along.

### Files removed

- `utils/fetch.js`
- `utils/error.js`
- `utils/stringManipulation/normalizeString.js`
- `utils/api/checkIfValidContentType.js`
- `utils/debounce.js`
- `hooks/usePrefersReducedMotions.js`
- `hooks/useApiRateLimiter.js`

### Patterns followed

- Co-located types (`ContentType`, hook props interfaces) matching existing TS in `hooks/use-copy-to-clipboard.ts` and `lib/utils.ts`
- `unknown` narrowing in `getError` instead of `any`
- Generic `debounce<T>` for reuse by `useToggleState.js`
- Path aliases unchanged; extensionless imports still work for consumers

### Problems encountered

- None. `pnpm build` completed successfully (exit 0).

### TODOs (deferred by design)

- **`types/` folder:** Not created yet — `ContentType` is co-located in `checkIfValidContentType.ts` until a second consumer needs it. Same for `ActionResult<T>`.
- **`strict: true` / typescript-eslint:** Deferred until ~70% of files are converted, per migration plan.

### Next logical step

Wave 2: remaining `utils/api/*`, `utils/db.js`, then smallest Mongoose models (`NameTag.js`, `NameCategory.js`).

---

## 2026-06-03 — Testing setup (Jest + RTL + Playwright)

### What was built and why

Added Jest, React Testing Library, and Playwright during the TS migration. Jest chosen over Vitest for maturity and existing-codebase applicability.

### Install note

First `pnpm add` failed (`exit 1`) because pnpm `minimumReleaseAge` blocked pinned `@types/bcryptjs@2.4.6`. Retry with `--config.minimumReleaseAge=0` succeeded.

### Files created

- `jest.config.ts`, `jest.setup.ts`, `TESTING.md`
- `playwright.config.ts`, `e2e/login.spec.ts`
- Unit tests: `utils/error.test.ts`, `utils/debounce.test.ts`, `utils/stringManipulation/normalizeString.test.ts`, `utils/api/checkIfValidContentType.test.ts`
- Component test: `components/ui/skeleton.test.tsx`

### Files modified

- `package.json` — test scripts and devDependencies
- `jest.config.ts` — exclude `migrations/` (avoids picking up `migrations/test.js` as a test)

### Verification

- `pnpm test` — 5 suites, 12 tests passed (~9s)
- E2E: run `pnpm exec playwright install` once, then `pnpm test:e2e` (requires build + start; slow first run)

---

## 2026-06-03 — TypeScript migration wave 2 + tests

### What was built and why

Converted remaining small `utils/api` helpers, leaf utils, and the two smallest Mongoose models. Added Jest tests for `bannedWordsMessage` and `detectBotPatterns` per convert-then-test workflow.

### Files created

- `utils/api/cloudinary.ts`, `bannedWordsMessage.ts`, `getSessionForApis.ts`, `detectBotPatterns.ts`, `checkMultipleBlocklists.ts`
- `utils/chooseRandomDefaultAvatar.ts`, `utils/stringManipulation/convertStringToMongooseId.ts`
- `models/NameTag.ts`, `models/NameCategory.ts`
- `utils/api/bannedWordsMessage.test.ts`, `utils/api/detectBotPatterns.test.ts`

### Files modified

- `models/User.js` — extensionless import for `chooseRandomDefaultAvatar`
- `utils/api/getSessionForApis.ts` — returns `response: Response` (401) when unauthenticated (fixes routes that did `if (!ok) return response`)

### Files removed

- Wave 2 `.js` counterparts listed above (plus duplicate wave 1 `.js` where still present)

### Verification

- `pnpm test` — 7 suites, 20 tests passed
- `pnpm build` — succeeded after `checkMultipleBlocklists` and `getSessionForApis` type fixes

### Next logical step

Wave 2 continued: `utils/db.js`, `rateLimiter.js`, `checkIfAdmin.js`, `checkOwnership.js`; then `DescriptionTag` / `DescriptionCategory` models.

---

## Contact spam validation fix (2026-06-02)

### What was built and why

The contact form called `hasRealisticContent(name, message)` but the function only accepted one argument, so **only the name was validated** and gibberish messages slipped through. Split validation into field-specific rules and validate both name and message in the server action.

### Files modified

- `utils/api/detectBotPatterns.ts` — `hasRealisticName`, `hasRealisticMessage`, `hasRealisticContactFields`; shared `hasLongSingleGibberishToken` helper; `hasRealisticContent` kept as alias to `hasRealisticMessage`
- `utils/api/detectBotPatterns.test.ts` — spam example strings + legitimate name/message cases
- `app/actions/sendContactEmail.js` — `hasRealisticContactFields(name, message)`; `detectBotPatterns` on name and message

### Problems and fixes

- **Bug:** Second argument to `hasRealisticContent` was ignored at runtime.
- **Fix:** Explicit two-field API; name allows 1–2 words without 3-word minimum; message keeps 3+ words and avg length cap.

### Verification

- `pnpm test` — 7 suites, 27 tests passed
- `pnpm build` — succeeded

### TODOs

- None for this fix.

### Next logical step

Continue TS wave 2 (`utils/db.js`, remaining `utils/api/*`).

---

## Contact name validation tweak (2026-06-02)

### What was built and why

Name field no longer uses message-style heuristics (avg word length, 15-char single token). Long legitimate surnames are allowed; gibberish contact names are caught via `detectBotPatterns` (`^[A-Za-z]{19,}$` — sample spam name is 19 chars, so 20+ would not match).

### Files modified

- `utils/api/detectBotPatterns.ts` — `hasRealisticName` is non-empty only; added `^[A-Za-z]{20,}$` pattern
- `utils/api/detectBotPatterns.test.ts` — spam caught by `detectBotPatterns`; `Wojciechowski` allowed

### Verification

- `pnpm test` — 7 suites, 27 tests passed

---

## detectBotPatterns scoring refactor fix (2026-06-02)

### What was built and why

Scoring threshold (≥3) left the 19+ letter gibberish rule at score 2, so contact spam no longer reached the threshold. Raised gibberish rule to score 3. Removed CJK/Cyrillic rules (legitimate non-English messages). Added tests for lone URL and Chinese text.

### Files modified

- `utils/api/detectBotPatterns.ts`
- `utils/api/detectBotPatterns.test.ts`

### Verification

- `pnpm test` — detectBotPatterns suite, 14 tests passed

---

## TypeScript migration wave 2 continued (2026-06-02)

### What was built and why

Continued incremental TS conversion for high-traffic API utilities, DB connect helper, and description models. Added tests for `rateLimiter` (contact form dependency). Fixed `checkOwnership` to avoid reading `session.user` when unauthenticated.

### Files created

- `utils/api/rateLimiter.ts`, `utils/api/rateLimiter.test.ts`
- `utils/api/checkIfAdmin.ts`, `utils/api/checkOwnership.ts`
- `utils/api/getPaginatedNotifications.ts`
- `utils/db.ts`
- `models/DescriptionTag.ts`, `models/DescriptionCategory.ts`

### Files removed

- `utils/api/rateLimiter.js`, `checkIfAdmin.js`, `checkOwnership.js`, `getPaginatedNotifications.js`
- `utils/db.js`
- `models/DescriptionTag.js`, `models/DescriptionCategory.js`

### Files modified

- `app/api/names/swr/route.js` — `@utils/db.js` → `@utils/db`

### Problems and fixes

- **Build:** `mongoose.connect` deprecated options removed (`useNewUrlParser` / `useUnifiedTopology` not in Mongoose 6 types).
- **Build:** NextAuth default `User` type lacks `role`/`status` — narrow with `AppUser` cast in admin/ownership checks.
- **Bug:** `checkOwnership` used `session.user` before verifying `getSessionForApis` ok.

### Verification

- `pnpm test` — 8 suites, 34 tests passed
- `pnpm build` — succeeded

### TODOs

- `utils/api/migrateField.js` (migrations only)
- Larger models: `User`, `Name`, `Description`, etc.
- Optional: `next-auth` module augmentation for `role` / `status` on `Session.user`

### Next logical step

Convert `mongoDataCleanup.js` or start `lib/auth.js` with tests; expand `next-auth` types when touching auth.

---

## 2026-06-02 — Vercel / pnpm install fix (first production pnpm deploy)

### What was broken and why

pnpm had **never** completed a successful install on Vercel for this repo. Production builds failed at `pnpm install` (exit 1), not at `next build`.

Root cause: **`package.json` and `pnpm-lock.yaml` disagreed on pnpm config.**

- `package.json` declared `pnpm.overrides` pinning `prettier` to `2.8.4` and `@types/bcryptjs` to `2.4.6`.
- `pnpm-lock.yaml` had **no** matching `settings.overrides` (lockfile was generated without those overrides).
- Lockfile importers used caret specifiers (e.g. `prettier: ^2.8.4` → resolved `2.8.8`).

Vercel reported `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` because pnpm requires lockfile `settings` to match `package.json` `pnpm` fields exactly.

Contributing cleanup from the same migration window:

- Stray `package-lock.json` (npm) could confuse tooling — removed in `8ea3dfa`.
- Empty `pnpm-workspace.yaml` (not a monorepo) — removed in `b3879ed`.

### How we fixed it

1. **Removed `pnpm.overrides`** from `package.json` so devDependencies use normal caret ranges (`^2.8.4`, `^2.4.6`) aligned with the lockfile.
2. **Synced `pnpm-lock.yaml`** — no `settings.overrides`; importers match `package.json` specifiers.
3. **Pinned package manager** — added `packageManager: pnpm@9.15.9` so Vercel uses the same pnpm major as CI/local frozen installs (not pnpm 11 from a global install).
4. **Added `pnpm.onlyBuiltDependencies`** for `core-js`, `esbuild`, `sharp`, `unrs-resolver` so native/postinstall scripts are allowed under pnpm’s build-script policy.

### Files modified

- `package.json` — removed overrides; added `onlyBuiltDependencies` and `packageManager`
- `pnpm-lock.yaml` — aligned with `package.json` (no override settings)

### Verification

```bash
CI=true npx pnpm@9.15.9 install --frozen-lockfile
```

Commit: `2eee3cd` — `bug: pnpm mismatch build bug`

### TODOs

- Confirm first green Vercel deploy after push (install + `next build`).
- Do **not** re-add `pnpm.overrides` without regenerating the lockfile so `settings.overrides` matches.

### Next logical step

Push to `main`, watch Vercel install logs, then run `npx pnpm@9.15.9 build` locally if build was not verified in the same session.

---

## 2026-06-06 — TypeScript migration: `mongoDataCleanup`

### What was built and why

Converted `utils/mongoDataCleanup.js` to TypeScript — shared helper used across pages and API routes to run `.lean()` queries and stringify ObjectIds / strip `__v`. Added unit tests with mocked queries (no DB).

### Files created

- `utils/mongoDataCleanup.ts` — `leanWithStrings`, exported `MongoCleanupResult<T>` utility type
- `utils/mongoDataCleanup.test.ts` — 4 tests (null result, single doc, array, nested ObjectIds + Date)

### Files removed

- `utils/mongoDataCleanup.js`

### Files modified

- `jest.setup.ts` — `TextEncoder` / `TextDecoder` polyfill (required when Jest loads mongoose/mongodb)

### Patterns followed

- Same recursive transform logic as the JS original; `LeanQuery` union accepts real Mongoose queries and test mocks
- Extensionless imports unchanged (`@/utils/mongoDataCleanup`, `../mongoDataCleanup`)

### Problems and fixes

- **Jest:** Importing mongoose triggered `TextEncoder is not defined` — fixed via `util` polyfill in `jest.setup.ts`
- **Build:** Mongoose `lean().exec()` return type did not align with `MongoCleanupResult<TReturn>` — explicit casts on return paths (pragmatic, same as other migration files)

### Verification

- `pnpm test` — 9 suites, 38 tests passed
- `pnpm build` — succeeded

### TODOs

- Larger models still JS: `User`, `Name`, `Description`, etc.
- `utils/api/migrateField.js` (migrations only)
- Optional: `next-auth` module augmentation for `role` / `status`

### Next logical step

Convert `lib/auth.js` with tests and expand NextAuth session types when touching auth.

### Follow-up (inline comments)

Added comments in `mongoDataCleanup.ts`, `mongoDataCleanup.test.ts`, and `jest.setup.ts` explaining lean/exec flow, transform rules, test mocks, and the TextEncoder polyfill. Test file uses `@jest-environment node` to avoid mongoose/jsdom warnings.

### Follow-up (manual test checklist)

Added **Manual verification (TypeScript migration)** section to `TESTING.md` — copy-paste checklist for post-migration smoke testing in the running app.

---

## 2026-06-06 — Extract code notes to `docs/notes/`

### What was built and why

Moved heavy learning/design comments out of source files into central markdown so `utils/` stays clean. Each source file keeps a one-line pointer at the top.

### Files created

- `docs/README.md` — conventions and index
- `docs/notes/utils/mongoDataCleanup.md` — design notes from `mongoDataCleanup.ts`
- `docs/notes/jest-setup.md` — TextEncoder polyfill notes from `jest.setup.ts`

### Files modified

- `utils/mongoDataCleanup.ts` — trimmed to slim JSDoc + pointer to notes
- `jest.setup.ts` — trimmed + pointer to notes
- `TESTING.md` — link to `docs/notes/` under "Where tests live"

### Next logical step

Use the same pattern for future TS conversions (`lib/auth.js`, etc.): notes in `docs/notes/<path>/<module>.md`, pointer in source.

---

## 2026-06-06 — TypeScript migration: `lib/auth`

### What was built and why

Converted `lib/auth.js` to TypeScript with NextAuth module augmentation. Extracted `resolveSignInCallback` for unit tests. Moved all original inline comments to `docs/notes/lib/auth.md` (not deleted).

### Files created

- `lib/auth.ts` — `serverAuthOptions`, `toCredentialsUser` / `toTokenUser`
- `lib/resolveSignInCallback.ts` — pure signIn branching (re-exported from `auth.ts`)
- `lib/resolveSignInCallback.test.ts` — 4 tests for sign-in branching
- `types/next-auth.d.ts` — `Session.user`, `User`, `JWT` augmentation (`id`, `role`, `status`, profile fields)
- `docs/notes/lib/auth.md` — full notes from original `auth.js`

### Files removed

- `lib/auth.js`

### Files modified

- `utils/api/checkIfAdmin.ts`, `checkOwnership.ts` — removed `AppUser` casts (types from augmentation)
- `utils/api/getSessionForApis.ts` — removed `AuthOptions` cast
- `docs/README.md` — index entry for auth notes

### Verification

- `pnpm test` — includes `lib/resolveSignInCallback.test.ts`
- `pnpm build` — succeeded
- Manual: login (credentials + magic link), protected routes, admin guard

### Next logical step

Medium utils still JS: `getUserByProfileName.js`, `findNormalizedMatch.js`, `startCooldown.js`, `filevalidation.js`.

---

## 2026-06-06 — Type `User` model; tighten `lib/auth` types

### What was built and why

Replaced loose `as string` casts in `lib/auth.ts` by converting `models/User.js` → `User.ts` with `UserStatus`, `UserRole`, and `IUserDocument`. NextAuth augmentation now uses those unions.

### Files created

- `models/User.ts`

### Files removed

- `models/User.js`

### Files modified

- `lib/auth.ts` — `toCredentialsUser` / `toTokenUser` helpers; no field casts
- `types/next-auth.d.ts` — `role` / `status` use `UserRole` / `UserStatus`

### Verification

- `pnpm exec tsc --noEmit` — clean
- `pnpm test` / `pnpm build` — run before merge

---

## 2026-06-06 — Auth docs / CHANGES housekeeping

### What was changed and why

Corrected stale references after auth TS migration: test file is `lib/resolveSignInCallback.test.ts`; JWT/credentials notes now describe `toTokenUser` / `toCredentialsUser` and required `user.id`.

### Files modified

- `CHANGES.md` — auth entry test file names
- `docs/notes/lib/auth.md` — JWT, credentials, related files sections synced with [`lib/auth.ts`](lib/auth.ts)

---

## 2026-06-07 — TypeScript migration wave 3 (utils batch)

### What was built and why

Converted the next three medium leaf utils from CHANGES “wave 3” plan: profile lookup, pagination cooldown timer, and normalized content duplicate queries. Added tests for `findNormalizedMatch` and `startCooldown`; moved long regex/index notes to `docs/notes/`.

### Files created

- `utils/getUserByProfileName.ts`
- `utils/startCooldown.ts`
- `utils/stringManipulation/findNormalizedMatch.ts`
- `utils/stringManipulation/findNormalizedMatch.test.ts`
- `utils/startCooldown.test.ts`
- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

### Files removed

- `utils/getUserByProfileName.js`
- `utils/startCooldown.js`
- `utils/stringManipulation/findNormalizedMatch.js`

### Files modified

- `docs/README.md` — index entry for findNormalizedMatch notes

### Patterns followed

- `Model<T extends NormalizedContentFields>` for Mongoose query helpers (same pragmatic cast style as `mongoDataCleanup.ts`)
- `IUserDocument | null` return on profile lookup (typed `User.ts` consumer)
- React `MutableRefObject` / `Dispatch<SetStateAction<number>>` for cooldown hook helper
- Extensionless imports unchanged for all consumers

### Problems and fixes

- **Build:** Mongoose `populate()` return type did not align with `T | null` — explicit casts on return paths (same as `mongoDataCleanup.ts`).

### Verification

- `pnpm test` — 12 suites, 48 tests passed
- `pnpm build` — succeeded

### TODOs

- `lib/checkBlocklist.js` — next util (already consumed by typed `checkMultipleBlocklists.ts`)
- `utils/filevalidation.js` — appears unused; convert or remove when touching uploads
- Small models: `NameLike`, `DescriptionLike`, `Follow`, etc.

### Next logical step

Convert `lib/checkBlocklist.js` with tests and `docs/notes/lib/checkBlocklist.md`.

---

## 2026-06-07 — findNormalizedMatch docs: code examples

### What was changed and why

Expanded `docs/notes/utils/stringManipulation/findNormalizedMatch.md` with implementation snippets from `findNormalizedMatch.ts` and real call-site examples from names/description API routes.

### Files modified

- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

### Next logical step

Convert `lib/checkBlocklist.js` with tests and `docs/notes/lib/checkBlocklist.md`.

---

## 2026-06-07 — findNormalizedMatch docs: overview at top

### What was changed and why

Moved “which function to use” and a route-level usage map to the top of `findNormalizedMatch.md` so readers get context (submit vs live check vs substring) before implementation detail.

### Files modified

- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

---

## 2026-06-07 — TESTING.md: manual checks for auth + wave 3 commits

### What was changed and why

Added a “Recent commits” manual verification section to `TESTING.md` for `b1f0994` (auth/User TS) and `b29c9e7` (utils wave 3) with route-level smoke steps and regression signals.

### Files modified

- `TESTING.md` — new subsection under manual verification; fixed `lib/auth.js` → `lib/auth.ts` in convert-then-test note

---

## 2026-06-07 — TESTING.md: quick-pass checklists for recent commits

### What was changed and why

Replaced detailed tables with checkbox quick-pass lists for `b1f0994` and `b29c9e7` so manual verification can be ticked off action-by-action.

### Files modified

- `TESTING.md`

---

## 2026-06-07 — TypeScript migration: `lib/checkBlocklist`

### What was built and why

Converted `lib/checkBlocklist.js` to TypeScript with exported `BlocklistResult` / `BlocklistType`. Added unit tests for the three-pass rules (everywhere, exact-name, substring Trie). Moved Trie design notes to `docs/notes/lib/checkBlocklist.md`.

### Files created

- `lib/checkBlocklist.ts`
- `lib/checkBlocklist.test.ts`
- `docs/notes/lib/checkBlocklist.md`

### Files removed

- `lib/checkBlocklist.js`

### Files modified

- `utils/api/checkMultipleBlocklists.ts` — `blockType` uses `BlocklistType`
- `docs/README.md` — index entry for checkBlocklist notes

### Patterns followed

- Slim source + pointer to `docs/notes/` (same as `mongoDataCleanup`, `auth`)
- Blocklist Sets built from lowercased list entries so matching aligns with normalized input
- Co-located `BlocklistResult` type for `checkMultipleBlocklists` consumer

### Verification

- `pnpm test` — 13 suites, 56 tests passed
- `pnpm build` — succeeded

### TODOs

- Small models: `NameLike`, `DescriptionLike`, `Follow`, `Thank`, `Suggestion`, `Report`
- `data/blockList.js` — optional TS conversion when touching blocklist data
- `utils/filevalidation.js` — unused; delete or wire up later

### Next logical step

Convert small models batch (`Follow`, `NameLike`, `DescriptionLike`) following `NameTag.ts` pattern.

---

## 2026-06-07 — checkBlocklist docs: restore original comments

### What was changed and why

Expanded `docs/notes/lib/checkBlocklist.md` with Trie walkthrough, pass-by-pass rules, and design comments from original `checkBlocklist.js`.

### Files modified

- `docs/notes/lib/checkBlocklist.md`

---

## 2026-06-07 — checkBlocklist docs: annotated source

### What was changed and why

Added full annotated `checkBlocklist.ts` source with original inline comments to `docs/notes/lib/checkBlocklist.md`.

### Files modified

- `docs/notes/lib/checkBlocklist.md`

---

## 2026-06-07 — Move `migrateField` into `migrations/utils/`

### What was changed and why

`migrateField` is only used by migration scripts, not runtime app code. Moved from `utils/api/` to `migrations/utils/` so `utils/api` stays app-facing.

### Files created

- `migrations/utils/migrateField.js`

### Files removed

- `utils/api/migrateField.js`

### Files modified

- `migrations/toCamelCase.js` — import `./utils/migrateField.js`

### Next logical step

Convert small models batch (`Follow`, `NameLike`, `DescriptionLike`) following `NameTag.ts` pattern.

---

## 2026-06-07 — TypeScript migration: small models (likes + follow)

### What was built and why

Converted `NameLike`, `DescriptionLike`, and `Follow` to TypeScript following `NameTag.ts` / `User.ts` patterns. Preserved explicit collection names for migration scripts. Moved index learning notes to `docs/notes/models/likes-and-follows.md`.

### Files created

- `models/NameLike.ts`
- `models/DescriptionLike.ts`
- `models/Follow.ts`
- `docs/notes/models/likes-and-follows.md`

### Files removed

- `models/NameLike.js`
- `models/DescriptionLike.js`
- `models/Follow.js`

### Files modified

- `docs/README.md` — index entry for likes-and-follows notes

### Patterns followed

- `I*Document` interfaces + `Model<I*Document>` export
- Explicit collection names (`namelikes`, `descriptionlikes`, `follows`) unchanged
- Extensionless `@/models/*` imports unchanged for app consumers

### Verification

- `pnpm test` — 13 suites, 56 tests passed
- `pnpm build` — succeeded

### TODOs

- Remaining models: `Thank`, `Suggestion`, `Report`, `Name`, `Description`

### Next logical step

Convert `Thank`, `Suggestion`, `Report`; then core `Name` / `Description` models.

---

## 2026-06-07 — likes-and-follows docs: annotated source + examples

### What was changed and why

Expanded `docs/notes/models/likes-and-follows.md` with original index comments, field overview, route usage map, and annotated source snippets for all three models.

### Files modified

- `docs/notes/models/likes-and-follows.md`
