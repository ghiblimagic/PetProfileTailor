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

---

## 2026-06-07 — TESTING.md: manual checks for checkBlocklist + likes models

### What was changed and why

Added checkbox quick-pass sections for `lib/checkBlocklist` and `NameLike` / `DescriptionLike` manual verification under Manual verification (TypeScript migration).

### Files modified

- `TESTING.md`

---

## 2026-06-07 — TESTING.md: chronological manual verification order

### What was changed and why

Reorganized manual verification checklists oldest migration → newest (wave 1 through likes models); merged regression signals into one table at the end.

### Files modified

- `TESTING.md`

---

## 2026-06-07 — TypeScript migration: Thank, Suggestion, Report

### What was built and why

Converted remaining small moderation/thanks models before core `Name` / `Description`. Preserved `fieldDescriptions` statics on Suggestion/Report and explicit `thanks` collection name.

### Files created

- `models/Thank.ts`
- `models/Suggestion.ts`
- `models/Report.ts`
- `docs/notes/models/moderation-and-thanks.md`

### Files removed

- `models/Thank.js`
- `models/Suggestion.js`
- `models/Report.js`

### Files modified

- `docs/README.md` — index entry for moderation-and-thanks notes

### Patterns followed

- `as const` status/outcome/priority unions (same as `User.ts`)
- `ISuggestionModel` / `IReportModel` for `fieldDescriptions` static typing
- Extensionless `@/models/*` imports unchanged

### Problems and fixes

- **Build:** Mongoose `schema.statics` direct assignment failed type-check — moved `fieldDescriptions` into schema `{ statics: { ... } }` option.
- **Thank `descriptionId` required:** kept legacy `(contentType as string) === "description"` to match existing API (enum is `"descriptions"`).

### Verification

- `pnpm test` — 13 suites, 56 tests passed
- `pnpm build` — succeeded

### Files modified (follow-up)

- `TESTING.md` — §11 manual checks for Thank / Suggestion / Report

### TODOs

- Core models: `Name.js`, `Description.js`

### Next logical step

Convert `Name` and `Description` models.

---

## 2026-06-07 — TESTING.md: restore checkbox progress after reorder

### What was changed and why

Chronological reorder reset §2 (formerly “Quick pass”) from `[x]` back to `[ ]`. Restored eight checked items from git history; added note to preserve checkbox state on future edits.

### Files modified

- `TESTING.md`

---

## 2026-06-07 — contact form: allow Japanese/CJK messages

### What was built and why

`hasRealisticMessage` required 3+ whitespace-separated words — Japanese (and much Chinese) is written without spaces, so legitimate contact submissions failed with “Please enter a valid message.”

### Files modified

- `utils/api/detectBotPatterns.ts` — `isPrimarilyChineseJapaneseKorean` path; Latin-only long single-token check
- `utils/api/detectBotPatterns.test.ts` — Japanese + Chinese message cases

### Problems and fixes

- **Root cause:** English word-count / avg-length heuristics applied to unsegmented Chinese/Japanese/Korean text.
- **Fix:** If ≥50% C/J/K characters (hiragana, katakana, hanzi, hangul), require minimum length only; keep Latin gibberish rules for spam tokens.

### Verification

- `pnpm test -- detectBotPatterns` — 17 tests passed

### Next logical step

Re-test §4 “Non-English message” on `/contact`.

---

## 2026-06-07 — contact form: non-Latin messages (Russian, Thai, etc.)

### What was changed and why

C/J/K-only bypass was too narrow. Refactored to `isPrimarilyLatin`: word-count heuristics apply only when ≥50% of letters are Latin; all other scripts (Cyrillic, Arabic, CJK, Thai, …) need minimum length only.

### Files modified

- `utils/api/detectBotPatterns.ts`
- `utils/api/detectBotPatterns.test.ts` — Russian + Thai cases

### Verification

- `pnpm test -- detectBotPatterns` — all tests passed

---

## 2026-06-07 — contact form: English and Spanish only

### What was built and why

Simplified contact policy for U.S. shelter focus: messages must use Latin script (English or Spanish). Non-Latin text is rejected with an explicit error; form shows the rule before submit.

### Files modified

- `utils/api/detectBotPatterns.ts` — `isEnglishOrSpanishScript`, `CONTACT_MESSAGE_LANGUAGE_ERROR`
- `utils/api/detectBotPatterns.test.ts`
- `app/actions/sendContactEmail.js` — language check before bot heuristics
- `components/Contact/ContactForm.jsx` — helper text under message field
- `TESTING.md` — §4 Spanish allowed / other languages rejected

### Note

Enforcement is by script (Latin letters + Spanish accents), not ML language detection — other Latin languages may pass; CJK, Cyrillic, Arabic, Thai, etc. are blocked.

### Verification

- `pnpm test -- detectBotPatterns`

---

## 2026-06-07 — TypeScript migration: Name and Description (final models)

### What was built and why

Converted the last two Mongoose models — all `models/*` are now TypeScript. Preserved `uniqueValidator` on Name, explicit `names` collection, Description optional `createdBy`.

### Files created

- `models/Name.ts`
- `models/Description.ts`
- `docs/notes/models/name-and-description.md`

### Files removed

- `models/Name.js`
- `models/Description.js`

### Files modified

- `docs/README.md` — index entry
- `TESTING.md` — §12 core content models
- `app/api/names/swr/route.js` — `@models/Name.js` → `@models/Name` (build fix)

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### TODOs

- Migration scripts still import `../models/Name.js` / `Description.js` — update paths if re-run with Node

### Next logical step

Model migration complete; convert high-traffic API routes or `sendContactEmail.js` next.

---

## 2026-06-08 — TypeScript migration: sendContactEmail server action

### What was built and why

Converted the contact form server action to TypeScript with exported `ContactEmailState` for `useActionState` typing. Preserved validation order (honeypot → timing → language → bots → captcha → rate limit → Resend).

### Files created

- `app/actions/sendContactEmail.ts`
- `docs/notes/app/actions/sendContactEmail.md`

### Files removed

- `app/actions/sendContactEmail.js`

### Files modified

- `docs/README.md` — index entry

### Patterns followed

- `getFormString` helper for `FormData` entries
- `RecaptchaVerifyResponse` interface for siteverify JSON
- Guard on missing `RESEND_EMAIL_FROM` / `RESEND_FROM_GMAIL` for strict null checks

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### Next logical step

Convert `app/api/names/route.js` or `ContactForm.jsx` to TypeScript.

---

## 2026-06-08 — sendContactEmail.ts: restore inline comments

### What was changed and why

Re-added section headers and at-a-glance comments from the original `.js` file after TS conversion stripped them.

### Files modified

- `app/actions/sendContactEmail.ts`

---

## 2026-06-08 — TypeScript migration: `app/api/names/route.ts` (first API route)

### What was built and why

Converted the main names CRUD route to TypeScript — first `app/api/*` route in the migration. Typed request bodies; narrowed `getSessionForApis` union; legacy commented Pages-router block moved to notes.

### Files created

- `app/api/names/route.ts`
- `docs/notes/app/api/names-route.md`

### Files removed

- `app/api/names/route.js`

### Files modified

- `docs/README.md` — index entry

### Patterns followed

- `Request` handler signatures; JSON body interfaces per method
- Extensionless `@models/Name`, `@utils/db` imports
- `auth.ok` guard before `auth.session` (discriminated union)
- `new mongoose.Types.ObjectId(contentId)` for DELETE (TS requires `new`)

### Problems and fixes

- **Build:** destructuring `session` before `ok` check failed strict union — use `auth` variable + narrow first.
- **Build:** `tags` assignment needed cast to `ObjectId[]`.

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### TODOs

- Remaining names routes: `swr`, `check-if-content-exists`, likes

### Next logical step

Convert `app/api/description/route.js` (mirror of names) or `ContactForm.jsx` to TypeScript.

---

## 2026-06-08 — names route PUT: fix blocklist condition (`||` not `|`)

### What was changed and why

PUT blocklist guard used bitwise `content | notes` (copy-paste error from legacy JS). Restored logical `content || notes` so blocklist runs when either field is present.

### Files modified

- `app/api/names/route.ts`
- `docs/notes/app/api/names-route.md` — removed obsolete legacy note

---

## 2026-06-08 — TypeScript migration: `app/api/description/route.ts`

### What was built and why

Converted descriptions CRUD route to TypeScript, mirroring `names/route.ts`. Typed helpers (`checkDuplicateDescription`, `returnExistingMessage`) and request bodies; preserved `new Response("Unauthorized")` and `{ error: err.message }` response shapes from the JS version.

### Files created

- `app/api/description/route.ts`
- `docs/notes/app/api/description-route.md`

### Files removed

- `app/api/description/route.js`

### Files modified

- `docs/README.md` — index entry

### Patterns followed

- Same as names route: `auth.ok` narrowing, `notes ?? ""` for blocklist, `new mongoose.Types.ObjectId` for DELETE lookup
- `IDescriptionDocument` for duplicate-check return typing
- Optional `createdBy` on model — non-null assertions where legacy route assumed doc exists

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### Next logical step

Convert `ContactForm.jsx` to TypeScript, or smaller API routes (`names/swr`, `description/swr`, check-if-content-exists).

---

## 2026-06-08 — Unit tests for recent migrations (extract + test pure logic)

### What was built and why

Recent route/action migrations were manual-only. Followed existing pattern (`resolveSignInCallback`, `detectBotPatterns`): extract pure validation into `utils/api/*`, add Jest suites. Full handler tests still need DB/auth mocks — not added.

### Files created

- `utils/api/validateContactSubmission.ts` + `.test.ts` — honeypot, timing, required fields, email, lengths, reCAPTCHA
- `utils/api/descriptionDuplicateCheck.ts` + `.test.ts` — duplicate guard decision + 409 payload
- `utils/stringManipulation/check-for-valid-content.test.ts` — name character rules (used by names route)

### Files modified

- `app/actions/sendContactEmail.ts` — uses `validateContactSubmission`
- `app/api/description/route.ts` — uses `descriptionDuplicateCheck`
- `docs/notes/app/actions/sendContactEmail.md`, `docs/notes/app/api/description-route.md`

### Verification

- `pnpm test` — 16 suites, 85 tests passed (+25)

### Still manual / not unit-tested

- Names/description route handlers (Mongoose + `getSessionForApis` mocks)
- Resend email send path
- Model schemas (Mongoose integration)
- `e2e/login.spec.ts` remains the only Playwright flow test

---

## 2026-06-08 — Names validation extract + Playwright `/addnames` and `/contact`

### What was built and why

Extracted names-route validation into unit-tested helpers. Added Playwright specs for contact (timing, language) and addnames (logged-out gate + optional authenticated submit). E2E contact tests use env-gated reCAPTCHA bypass (`E2E_TEST_MODE` / `NEXT_PUBLIC_E2E_TEST_MODE`) only when Playwright starts the server.

### Files created

- `utils/api/validateNameSubmission.ts` + `.test.ts`
- `e2e/addnames.spec.ts`, `e2e/contact.spec.ts`, `e2e/helpers/auth.ts`

### Files modified

- `app/api/names/route.ts` — uses `validateNameSubmission`
- `app/actions/sendContactEmail.ts`, `components/Contact/ContactForm.jsx` — E2E bypass
- `playwright.config.ts` — E2E env on `webServer`
- `docs/notes/app/api/names-route.md`, `TESTING.md`

### Verification

- `pnpm test` — 17 suites, 92 tests passed
- `pnpm test:e2e:local` — 6 passed, 2 skipped (no `PLAYWRIGHT_TEST_*` creds)

### E2E follow-up fixes (freeze + selectors)

- Contact Submit was disabled up to 10s while reCAPTCHA loaded — tests timed out waiting; E2E build now skips that gate
- `pnpm test:e2e` can hang if port 3000 is busy during `build && start` — added `pnpm test:e2e:local` + `scripts/playwright-local.mjs`
- Fixed contact selectors (`input[name=…]`), login strict-mode Register link, addnames logged-out test

---

## 2026-06-08 — E2E: MONGODB_URI_TEST + NextAuth notes

### What was changed and why

Playwright `webServer` now sets `MONGODB_URI` from `MONGODB_URI_TEST` so E2E hits an isolated DB while dev keeps `MONGODB_URI`. Added `pnpm build:e2e` / `pnpm start:e2e` for local E2E server; documented that NextAuth uses the same swapped URI (seed test user once via `/register`).

### Files modified

- `playwright.config.ts`, `package.json`, `scripts/build-e2e.mjs`, `scripts/start-e2e.mjs`, `TESTING.md`

---

## 2026-06-08 — E2E: register reCAPTCHA bypass for test DB seeding

### What was changed and why

`/register` required reCAPTCHA, which fails on localhost. Added same E2E bypass as contact (`e2e-bypass` token when `E2E_TEST_MODE` / `NEXT_PUBLIC_E2E_TEST_MODE` set at build/start).

### Files created

- `utils/api/e2eTestMode.ts`

### Files modified

- `app/api/auth/signup/route.js`, `components/Register/RegisterForm.jsx`
- `components/Contact/ContactForm.jsx`, `app/actions/sendContactEmail.ts` — use shared helper
- `TESTING.md`

---

## 2026-06-08 — `pnpm seed:e2e-user` CLI for test DB

### What was built and why

Browser register + captcha blocked seeding the Playwright user. Script inserts/updates credentials user directly in `MONGODB_URI_TEST` from env vars.

### Files created

- `scripts/seed-e2e-user.mjs`

### Files modified

- `package.json` — `seed:e2e-user` script
- `TESTING.md`

---

## 2026-06-08 — Expand E2E + TESTING.md E2E vs manual matrix

### What was built and why

Added Playwright coverage for manual checks that automate cleanly (contact spam/language/rate limit, login auth, addnames duplicate/blocklist, browse load). Documented which § items E2E replaces vs still manual.

### Files created

- `e2e/browse.spec.ts`, `e2e/helpers/contact.ts`

### Files modified

- `e2e/contact.spec.ts`, `e2e/login.spec.ts`, `e2e/addnames.spec.ts`
- `app/actions/sendContactEmail.ts` — rate limit before E2E email skip
- `TESTING.md`, `docs/notes/app/actions/sendContactEmail.md`

---

## 2026-06-08 — TESTING.md: E2E owns automated flows; manual = captcha/email/gaps

### What was changed and why

Removed manual checklist items now covered by Playwright. Manual section reorganized by what E2E cannot test (captcha, Resend, magic link, multi-user, admin, content depth, Network inspection).

### Files modified

- `TESTING.md`

---

## 2026-06-08 — TypeScript migration: `app/api/auth/signup/route.ts`

### What was built and why

Converted signup API to TypeScript; extracted pure field validation to `validateSignupSubmission` (unit tested). Uses shared `isE2eCaptchaBypass`; removed dead `createSecretKey` import from legacy JS.

### Files created

- `app/api/auth/signup/route.ts`
- `utils/api/validateSignupSubmission.ts`, `validateSignupSubmission.test.ts`
- `docs/notes/app/api/signup-route.md`

### Files modified

- `docs/README.md`

### Files removed

- `app/api/auth/signup/route.js`

### Verification

- `pnpm test` — 98 passed
- `pnpm build` — OK

### Next logical step

Convert `app/api/names/swr/route.js` or `RegisterForm.jsx` to TypeScript.

---

## 2026-06-08 — Restore `.gitattributes` (LF line endings)

### What was changed and why

Re-added repo-level line-ending rules so Git stops warning about LF/CRLF on Windows. Text files use LF; common binary extensions are excluded.

### Files created

- `.gitattributes`

### Next logical step

After pulling this file, run `git add --renormalize .` once if old CRLF files still warn, then recommit.

---

## 2026-06-08 — Follow API: use `Follow` model (not `User.followers`)

### What was changed and why

Followers live in the `follows` collection (`models/Follow.ts`), not on `User`. Reverted mistaken `followers` field on `User`. `updatefollows` now upserts/deletes `Follow` docs; profile and `getASpecificUserByProfileName` load followers via `getUserFollowers`.

### Files created

- `utils/api/getUserFollowers.ts`

### Files modified

- `app/api/user/updatefollows/route.js`
- `app/api/user/getASpecificUserByProfileName/[name]/route.js`
- `app/profile/[profilename]/page.jsx`
- `models/User.ts` (reverted `followers`)
- `scripts/seed-e2e.mjs`, `docs/notes/models/likes-and-follows.md`

---

## 2026-06-08 — E2E: admin, edits, social specs

### What was built and why

Added Playwright coverage for admin access, ownership edits, and social flows using seeded user + admin. Extended fixtures with admin-owned name/description.

### Files created

- `e2e/admin.spec.ts`, `e2e/edits.spec.ts`, `e2e/social.spec.ts`
- `e2e/helpers/seed-lookup.ts`, `e2e/helpers/likes.ts`

### Files modified

- `e2e/fixtures/seed-data.json`, `seed-data.ts`, `scripts/seed-e2e.mjs`
- `TESTING.md`

---

## 2026-06-08 — E2E shared seed fixtures (name, descriptions, admin)

### What was built and why

Single source of truth for seeded test DB content: `e2e/fixtures/seed-data.json` is read by `pnpm seed:e2e` and Playwright tests via `seed-data.ts`. Duplicate name/description specs no longer create-then-duplicate at runtime.

### Files created

- `e2e/fixtures/seed-data.json`, `e2e/fixtures/seed-data.ts`
- `scripts/seed-e2e.mjs`

### Files modified

- `e2e/addnames.spec.ts`, `e2e/adddescriptions.spec.ts`
- `e2e/helpers/auth.ts` — `loginWithAdminCredentials`
- `e2e/helpers/register.ts` — profile name from fixture module
- `package.json`, `TESTING.md`

### Files removed

- `scripts/seed-e2e-user.mjs` (replaced by `seed-e2e.mjs`; `seed:e2e-user` script kept as alias)

### Next logical step

Add admin/ownership E2E using `loginWithAdminCredentials` and seeded admin user.

---

## 2026-06-08 — E2E: move more manual checks (auth, descriptions, blocklist, API shape)

### What was built and why

Reviewed remaining manual verification items and automated flows that do not need captcha, Resend, or a second user: session/dashboard/notifications/profile, sign-out round-trip, description create/detail, duplicate “check if exists” (start vs middle), name/detail page, `fluffy butt` negative blocklist case, editsettings validation, duplicate register email, and names SWR `_id` string shape.

### Files created

- `e2e/auth-session.spec.ts`
- `e2e/adddescriptions.spec.ts`
- `e2e/editsettings.spec.ts`
- `e2e/helpers/descriptions.ts`

### Files modified

- `e2e/helpers/auth.ts` — `openProfileMenu`, `signOutViaNav`
- `e2e/addnames.spec.ts`, `e2e/register.spec.ts`, `e2e/browse.spec.ts`
- `TESTING.md` — E2E bullets + trimmed manual checklist

### Problems encountered

- Description form does not require tags server-side; removed flaky react-select helper.
- Nav menu items use Headless UI `menuitem` role, not `link` / `button` for Profile/Logout.
- Contact rate-limit test must run last in serial `contact.spec.ts` (Spanish + legitimate consume 2 of 3 IP slots).

### TODOs

- Social/notification flows still need a second seeded E2E user.
- Pagination/sort cooldown tests skipped (15s+ waits).
- Full register happy path + default avatar still manual (real captcha).

### Next logical step

Run `pnpm seed:e2e-user && pnpm test:e2e` and fix any flaky tag-select or aggregate `_id` assertions.

---

## 2026-06-08 — E2E: contact spam message + register duplicate profilename

### What was built and why

Gibberish contact message and duplicate `PLAYWRIGHT_TEST_PROFILENAME` on register are automatable with E2E captcha bypass; removed from manual checklist.

### Files created

- `e2e/register.spec.ts`, `e2e/helpers/register.ts`

### Files modified

- `e2e/contact.spec.ts`, `TESTING.md`

---

## 2026-06-09 — TypeScript: `RegisterForm`

### What was changed and why

Converted the register form to TypeScript as part of the signup-route migration. Typed `react-hook-form` values, signup API response/errors (`SignupFieldErrors`), captcha flow, and axios error handling. Removed leftover debug `console.log` / render-side logging.

### Files created

- `components/Register/RegisterForm.tsx`
- `components/FormComponents/RegisterInput.d.ts`
- `components/ReusableSmallComponents/buttons/GeneralButton.d.ts`

### Files removed

- `components/Register/RegisterForm.jsx`

### Files modified

- `docs/notes/app/api/signup-route.md`

### Verification

- `pnpm build` — OK

### TODOs

- `checkIfNameExists` / `resetData` state helpers are still unused in the JSX (pre-existing).
- `RegisterInput.jsx` / `GeneralButton.jsx` still JS; `.d.ts` stubs only unblock TS consumers.

### Next logical step

Run `pnpm test:e2e e2e/register.spec.ts` or convert `app/api/names/swr/route.js` next.

---

## 2026-06-09 — TypeScript: `names/swr` API route

### What was changed and why

Converted paginated names SWR listing to TypeScript. Extracted pure GET/POST source parsing and sort defaults into `parseNamesSwrRequest.ts` (6 unit tests). Behavior unchanged: POST body + query merge, `_id` sort tiebreaker, 50-item pages.

### Files created

- `app/api/names/swr/route.ts`
- `utils/api/parseNamesSwrRequest.ts`, `parseNamesSwrRequest.test.ts`
- `docs/notes/app/api/names-swr-route.md`

### Files removed

- `app/api/names/swr/route.js`

### Files modified

- `docs/notes/app/api/names-route.md`, `docs/README.md`

### Verification

- `pnpm test -- parseNamesSwrRequest` — 6 passed
- `pnpm build` — OK

### Next logical step

Convert `app/api/description/swr/route.js` (similar shape) or run `pnpm test:e2e e2e/browse.spec.ts`.

---

## 2026-06-09 — TypeScript: `description/swr` API route

### What was changed and why

Converted paginated descriptions SWR listing to TypeScript. Reused `parseNamesSwrRequest.ts` with description-specific helpers (`buildSwrFilterSourceFromSearchParams`, `parseSwrPaginationFromSearchParams`). Preserved original behavior: page/sort always from URL; filters from POST body or query `getAll`. Kept PUT/DELETE 405.

### Files created

- `app/api/description/swr/route.ts`
- `docs/notes/app/api/description-swr-route.md`

### Files removed

- `app/api/description/swr/route.js`

### Files modified

- `utils/api/parseNamesSwrRequest.ts`, `parseNamesSwrRequest.test.ts` (3 new tests, 9 total)
- `docs/notes/app/api/description-route.md`, `docs/README.md`

### Verification

- `pnpm test -- parseNamesSwrRequest` — 9 passed
- `pnpm build` — OK

### Next logical step

Run `pnpm test:e2e e2e/browse.spec.ts` or convert smaller API routes (`check-if-content-exists`, `grabusersfollowing`).

---

## 2026-06-09 — Restore original inline comments on SWR routes

### What was changed and why

Re-added explanatory comments from the original `route.js` files into `names/swr/route.ts`, `description/swr/route.ts`, and `parseNamesSwrRequest.ts` (POST/GET merge, likedIds Case 1/2, filter build, aggregation sections, handler docs).

### Files modified

- `app/api/names/swr/route.ts`
- `app/api/description/swr/route.ts`
- `utils/api/parseNamesSwrRequest.ts`

---

## 2026-06-09 — VS Code: save files with LF line endings

### What was changed and why

Added `"files.eol": "\n"` to workspace settings so Cursor/VS Code saves new edits as LF on Windows, matching `.gitattributes` and reducing CRLF warnings on `git add`.

### Files modified

- `.vscode/settings.json`

### Next logical step

Re-save or convert any files still showing `w/crlf` (`git ls-files --eol | rg w/crlf`), then run `git add` again.

---

## 2026-06-09 — One-time CRLF → LF working-tree normalize

### What was changed and why

`files.eol` only affects new saves; 344 tracked files still had CRLF on disk (`w/crlf`). Converted working copies to LF and added `.editorconfig` so editors respect LF alongside `.gitattributes`.

### Files created

- `.editorconfig`

### Verification

- `git ls-files --eol | rg w/crlf` — 0 matches
- `git add .` — no CRLF warnings

---

## 2026-06-09 — TypeScript: `check-if-content-exists` routes

### What was changed and why

Converted live duplicate-check API routes for names and descriptions to TypeScript. Behavior unchanged: names use blocklist + invalid chars + exact normalized match; descriptions use blocklist + `findStartNormalized`. Removed unused imports (names) and debug `console.log` (descriptions).

### Files created

- `app/api/names/check-if-content-exists/[content]/route.ts`
- `app/api/description/check-if-content-exists/[content]/route.ts`
- `docs/notes/app/api/check-if-content-exists.md`

### Files removed

- `app/api/names/check-if-content-exists/[content]/route.js`
- `app/api/description/check-if-content-exists/[content]/route.js`

### Files modified

- `docs/notes/app/api/names-route.md`, `description-route.md`, `docs/README.md`
- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

### Verification

- `pnpm build` — OK

### Next logical step

Run `pnpm test:e2e e2e/adddescriptions.spec.ts` or convert `app/api/user/grabusersfollowing` (Follow model fix).

---

## 2026-06-09 — TypeScript + Follow fix: `grabusersfollowing`

### What was changed and why

`GET /api/user/grabusersfollowing/[userid]` no longer queries removed `User.followers`. Added `getUserFollowing` (reads `Follow` where `followedBy = userid`, populates `userId`). Converted route to TypeScript. Profile page commented hook updated for when following UI is re-enabled. E2E social spec asserts the API after admin follow.

### Files created

- `app/api/user/grabusersfollowing/[userid]/route.ts`
- `utils/api/getUserFollowing.ts`
- `docs/notes/app/api/grabusersfollowing-route.md`

### Files removed

- `app/api/user/grabusersfollowing/[userid]/route.js`

### Files modified

- `app/profile/[profilename]/page.jsx`
- `e2e/social.spec.ts`
- `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- `pnpm test:e2e e2e/social.spec.ts` — run with seeded test DB

### Next logical step

Convert `app/api/user/updatefollows/route.js` or `ContactForm.jsx` to TypeScript.

---

## 2026-06-09 — TypeScript: `updatefollows` API route

### What was changed and why

Converted follow toggle route to TypeScript. Behavior unchanged: session auth, upsert/delete `Follow` docs based on `userFollowed` UI flag. Uses `Response.json` (same payloads as before).

### Files created

- `app/api/user/updatefollows/route.ts`
- `docs/notes/app/api/updatefollows-route.md`

### Files removed

- `app/api/user/updatefollows/route.js`

### Files modified

- `docs/notes/app/api/grabusersfollowing-route.md`, `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/social.spec.ts` (existing follow tests)

### Next logical step

Convert `ContactForm.jsx` or like-toggle routes (`names/likes/.../togglelike`).

---

## 2026-06-09 — TypeScript: togglelike routes (names + descriptions)

### What was changed and why

Converted both like-toggle API routes to TypeScript. Preserved transaction flow, original inline comments, and route-specific quirks (names passes `{ req }` to `getSessionForApis`; description calls it with no args; description keeps GET 405).

### Files created

- `app/api/names/likes/[contentId]/togglelike/route.ts`
- `app/api/description/likes/[contentId]/togglelike/route.ts`
- `docs/notes/app/api/togglelike-route.md`

### Files removed

- `app/api/names/likes/[contentId]/togglelike/route.js`
- `app/api/description/likes/[contentId]/togglelike/route.js`

### Files modified

- `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/social.spec.ts`, `e2e/helpers/likes.ts`

### Next logical step

Convert `ContactForm.jsx` or notification routes (`app/api/notifications/names/route.js`).

---

## 2026-06-09 — TypeScript: `ContactForm`

### What was changed and why

Converted contact form to TypeScript. Typed `useActionState` with `ContactEmailState`, captcha flow (v3/v2/E2E bypass), and form submit handler. Renamed default export to `ContactForm` (was `ContactPage` in JSX file). Added `.d.ts` stubs for `StyledInput` / `StyledTextarea`.

### Files created

- `components/Contact/ContactForm.tsx`
- `components/FormComponents/StyledInput.d.ts`, `StyledTextarea.d.ts`

### Files removed

- `components/Contact/ContactForm.jsx`

### Files modified

- `docs/notes/app/actions/sendContactEmail.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/contact.spec.ts`

### Next logical step

Convert notification routes or `app/contact/page.jsx`.

---

## 2026-06-09 — TypeScript: notification API routes

### What was changed and why

Converted all six notification routes (names, descriptions, thanks — each with `mark-read`). Added `parseNotificationPagination` to shared helper. Preserved `$ne` ObjectId comments on names route, thanks PATCH comments, and descriptions error strings (pre-existing copy). Removed debug `console.log` from thanks GET.

### Files created

- `app/api/notifications/names/route.ts`, `names/mark-read/route.ts`
- `app/api/notifications/descriptions/route.ts`, `descriptions/mark-read/route.ts`
- `app/api/notifications/thanks/route.ts`, `thanks/mark-read/route.ts`
- `docs/notes/app/api/notifications-routes.md`

### Files removed

- Six corresponding `route.js` files under `app/api/notifications/`

### Files modified

- `utils/api/getPaginatedNotifications.ts`
- `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/social.spec.ts`, `e2e/auth-session.spec.ts`

### Next logical step

Convert `app/contact/page.jsx` or `app/(protected)/notifications/page.jsx`.

---

## 2026-06-09 — Restore populate side-effect imports on notification routes

### What was changed and why

Re-added `User` / `Name` / `Description` imports on notification GET routes. They register Mongoose models so `populate()` can resolve `ref` fields — not dead code. Documented in `notifications-routes.md`.

### Files modified

- `app/api/notifications/names/route.ts`
- `app/api/notifications/descriptions/route.ts`
- `app/api/notifications/thanks/route.ts`
- `docs/notes/app/api/notifications-routes.md`

---

## 2026-06-09 — Notifications: unit + E2E tests

### What was built and why

Added notification test coverage: unit tests for `parseNotificationPagination`; E2E for 401, populate shape (guards ref model imports), description notifications, and names mark-read. Thanks notifications remain manual (no seeded thank helper).

### Files created

- `utils/api/getPaginatedNotifications.test.ts`
- `e2e/notifications.spec.ts`

### Files modified

- `e2e/helpers/likes.ts` — `ensureDescriptionLiked`
- `TESTING.md`, `docs/notes/app/api/notifications-routes.md`

### Verification

- `pnpm test -- getPaginatedNotifications` — 3 passed
- `pnpm test:e2e e2e/notifications.spec.ts` — run with seeded test DB

---

## 2026-06-09 — Audit: restore populate side-effect imports across TS conversions

### What was changed and why

Audited all `.populate()` call sites vs git history. Several TS conversions dropped ref-model imports that existed in JS (or were never added on new Follow/findNormalized helpers). Restored `// necessary for populate` imports on names/description routes, check-if-content-exists, getUserFollowers/Following, findNormalizedMatch. Documented full audit table in `notifications-routes.md`.

### Files modified

- `app/api/names/route.ts`, `app/api/description/route.ts`
- `app/api/names/check-if-content-exists/[content]/route.ts`
- `utils/api/getUserFollowers.ts`, `getUserFollowing.ts`
- `utils/stringManipulation/findNormalizedMatch.ts`
- `docs/notes/app/api/notifications-routes.md`

---

## 2026-06-09 — TypeScript: `app/contact/page`

### What was changed and why

Converted contact page wrapper to TypeScript. Renamed default export `CustomError` → `ContactPage` (route is `/contact`). Added `PageTitleWithImages.d.ts` for TS consumer.

### Files created

- `app/contact/page.tsx`
- `components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages.d.ts`

### Files removed

- `app/contact/page.jsx`

### Files modified

- `docs/notes/app/actions/sendContactEmail.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/contact.spec.ts`

### Next logical step

Convert `app/(protected)/notifications/page.jsx` or `app/api/user/likes/route.js`.

---

## 2026-06-07 — Fix `PageTitleWithImages` props on contact page

### What was changed and why

`app/contact/page.tsx` failed type-check because TypeScript inferred all destructured props (`imgSrc`, `title`, `title2`) as required from the untyped `.jsx` component, ignoring the optional `.d.ts`. Converted the component to `.tsx` with an explicit optional props type.

### Files created

- `components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages.tsx`

### Files removed

- `components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages.jsx`
- `components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages.d.ts`

### Verification

- `pnpm build` — OK
- `pnpm exec tsc --noEmit` — no errors on contact page / `PageTitleWithImages`

### Next logical step

Continue TS migration (`app/(protected)/notifications/page.jsx` or remaining API routes).

---

## 2026-06-07 — TypeScript: `app/(protected)/notifications/page`

### What was changed and why

Converted the protected notifications server page to TypeScript. Kept `User` / `Name` populate side-effect imports; removed unused imports (`Description`, `Thank`, `leanWithStrings`, `MarkThanksRead`). Added `ToggleOneNotificationPage.d.ts` so optional props (`swrForThisUserID`) type-check from TS consumers.

### Files created

- `app/(protected)/notifications/page.tsx`
- `components/Notifications/ToggleOneNotificationPage.d.ts`
- `docs/notes/app/notifications-page.md`

### Files removed

- `app/(protected)/notifications/page.jsx`

### Files modified

- `docs/README.md`
- `docs/notes/app/api/notifications-routes.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/user/likes/route.js` or `ToggleOneNotificationPage.jsx` to `.tsx`.

---

## 2026-06-07 — TypeScript: `ToggleOneNotificationPage`

### What was changed and why

Converted the notifications tab client component to `.tsx` with exported prop types (`NotificationTabConfig`, `NotificationModelType`). Removed unused imports. Added `.d.ts` stubs for `useSWRSimple` and `notificationsContext` so `initialPage` and unread-count context type-check. Expanded `docs/notes/app/notifications-page.md` with SWR lazy-load and mark-read behavior. Removed the interim `ToggleOneNotificationPage.d.ts`.

### Files created

- `components/Notifications/ToggleOneNotificationPage.tsx`
- `hooks/useSwrSimple.d.ts`
- `context/notificationsContext.d.ts`

### Files removed

- `components/Notifications/ToggleOneNotificationPage.jsx`
- `components/Notifications/ToggleOneNotificationPage.d.ts`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/user/likes/route.js` or `NotifListingWrapper.jsx` to `.tsx`.

---

## 2026-06-07 — TypeScript: `hooks/useSwrSimple`

### What was changed and why

Converted notification infinite-SWR hook from `.js` to `.ts`, replacing the interim `.d.ts`. Exported `NotificationModelType`, `UseSWRSimpleOptions`, and `SwrSimpleReturn` from the implementation so `ToggleOneNotificationPage` and `notificationsContext.d.ts` resolve types from the real module.

### Files created

- `hooks/useSwrSimple.ts`

### Files removed

- `hooks/useSwrSimple.js`
- `hooks/useSwrSimple.d.ts`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `context/notificationsContext.js` or `NotifListingWrapper.jsx` to `.tsx`.

---

## 2026-06-07 — TypeScript: `context/notificationsContext`

### What was changed and why

Converted notifications context from `.js` to `.tsx`, replacing the interim `.d.ts`. Exported `NotificationCounts` and `NotificationsContextValue`; typed API response, `resetNotificationType`, and `createContext` null guard.

### Files created

- `context/notificationsContext.tsx`

### Files removed

- `context/notificationsContext.js`
- `context/notificationsContext.d.ts`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `NotifListingWrapper.jsx` or `app/api/user/notifications/route.js` to complete the notifications cluster.

---

## 2026-06-07 — TypeScript: `NotifListingWrapper`

### What was changed and why

Converted shared notifications list shell to `.tsx`. Typed SWR hook, listing component, and recheck/load-more handlers. Removed unused `LikeNotificationListing` import from the JSX original. `docs` accepts `unknown[]` from SWR with `_id` cast at render time.

### Files created

- `components/Notifications/NotifListingWrapper.tsx`

### Files removed

- `components/Notifications/NotifListingWrapper.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/user/notifications/route.js` to complete the notifications cluster, or `LikeNotificationListing.jsx` / `ThankNotificationListing.jsx`.

---

## 2026-06-07 — TypeScript: `app/api/user/notifications/route`

### What was changed and why

Converted unread-count API to TypeScript — completes the notifications cluster (badge API + context + UI + paginated feeds). Exported `UserNotificationsCountsResponse`. Removed unused `leanWithStrings` import; aligned `dbConnect` import with other notification routes; fixed error log message (was "suggestions").

### Files created

- `app/api/user/notifications/route.ts`

### Files removed

- `app/api/user/notifications/route.js`

### Files modified

- `docs/notes/app/api/notifications-routes.md`
- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `LikeNotificationListing.jsx` / `ThankNotificationListing.jsx`, or delete stale duplicate `app/api/notifications/**/route.js` files alongside `.ts` versions.

---

## 2026-06-07 — TypeScript: `wrappers/NotificationWrapper`

### What was changed and why

Converted thin client wrapper for `NotificationsProvider` to `.tsx` so the server `app/layout.js` can mount notification context with typed `children`. Removed unused `useEffect` / `useState` imports from the JSX original.

### Files created

- `wrappers/NotificationWrapper.tsx`

### Files removed

- `wrappers/NotificationWrapper.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `LikeNotificationListing.jsx` / `ThankNotificationListing.jsx` or `NotificationsButton.jsx`.

---

## 2026-06-07 — TypeScript: `LikeNotificationListing`

### What was changed and why

Converted like-notification row component to `.tsx`. Exported `LikeNotification` type aligned with E2E populate shape. Safe optional access on `contentId` / `likedBy`; `ProfileImage` width/height as strings per JS component defaults.

### Files created

- `components/Notifications/LikeNotificationListing.tsx`

### Files removed

- `components/Notifications/LikeNotificationListing.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `ThankNotificationListing.jsx` or `NotificationsButton.jsx`.

---

## 2026-06-07 — TypeScript: `ThankNotificationListing`

### What was changed and why

Converted thank-notification row component to `.tsx`. Exported `ThankNotification` type aligned with `/api/notifications/thanks` populate shape. Same patterns as like rows: optional refs, `ProfileImage` href/onClick, intersection observer fade.

### Files created

- `components/Notifications/ThankNotificationListing.tsx`

### Files removed

- `components/Notifications/ThankNotificationListing.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `NotificationsButton.jsx` or delete stale duplicate `app/api/notifications/**/route.js` files.

---

## 2026-06-07 — TypeScript: `NotificationsButton`

### What was changed and why

Converted nav notification bell to `.tsx` — completes the notifications UI folder. Removed unused `faBell` import and unused context destructuring. Fixed broken `className` template literal (was rendering literal `className="..."` text).

### Files created

- `components/Notifications/NotificationsButton.tsx`

### Files removed

- `components/Notifications/NotificationsButton.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

`app/api/user/likes/route.js`, `hooks/useLocalStorageCooldown.js`, or protected pages (`dashboard`, `editsettings`).

---

## 2026-06-07 — TypeScript: `app/api/user/likes/route`

### What was changed and why

Converted user likes bulk-fetch API to TypeScript. Exported `UserLikesResponse` / `UserLikeEntry` for `LikesContext` consumers. Aligned model imports (`NameLike`, `DescriptionLike`) and `dbConnect` with other user API routes.

### Files created

- `app/api/user/likes/route.ts`
- `docs/notes/app/api/user-likes-route.md`

### Files removed

- `app/api/user/likes/route.js`

### Files modified

- `docs/README.md`
- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `context/LikesContext.js` or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `context/LikesContext`

### What was changed and why

Converted likes context to `.tsx`. Typed `likesRef` maps, `recentLikesRef` session deltas, and API response via `UserLikesResponse` from `app/api/user/likes/route.ts`. Removed unused `useState` import from the JS original.

### Files created

- `context/LikesContext.tsx`

### Files removed

- `context/LikesContext.js`

### Files modified

- `docs/notes/app/api/user-likes-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `wrappers/LikesWrapper.jsx`, `hooks/useLikeState.js`, or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `wrappers/LikesWrapper`

### What was changed and why

Converted thin client wrapper for `LikesProvider` to `.tsx` so the server layout can mount likes context with typed `children` (same pattern as `NotificationWrapper`).

### Files created

- `wrappers/LikesWrapper.tsx`

### Files removed

- `wrappers/LikesWrapper.jsx`

### Files modified

- `docs/notes/app/api/user-likes-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useLikeState.js` or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `hooks/useLikeState`

### What was changed and why

Converted like-button hook to `.ts`. Exported `LikeableContent`, `UseLikeStateParams`; wired `RecentLikeDelta` rollback typing via `useToggleState<RecentLikeDelta>`. Added `hooks/useToggleState.d.ts` for callback generics. `userId` param kept optional (callers pass it; hook does not use it).

### Files created

- `hooks/useLikeState.ts`
- `hooks/useToggleState.d.ts`

### Files removed

- `hooks/useLikeState.js`

### Files modified

- `docs/notes/app/api/togglelike-route.md`
- `docs/notes/app/api/user-likes-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useToggleState.js` or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `hooks/useToggleState`

### What was changed and why

Converted debounced optimistic-toggle hook to `.ts`, replacing the interim `.d.ts`. Exported `UseToggleStateOptions<TRollback>` generic; typed `rollbackRef`. Rollback only runs when a snapshot exists (`!== undefined`, so `RecentLikeDelta` `0` still rolls back).

### Files created

- `hooks/useToggleState.ts`

### Files removed

- `hooks/useToggleState.js`
- `hooks/useToggleState.d.ts`

### Files modified

- `docs/notes/app/api/togglelike-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useLocalStorageCooldown.js` or `components/ReusableSmallComponents/buttons/LikesButtonAndLikesLogic.js`.

---

## 2026-06-07 — TypeScript: `hooks/useLocalStorageCooldown`

### What was changed and why

Converted localStorage cooldown hook to `.ts`. Exported `UseLocalStorageCooldownReturn`; typed `key`, `duration`, and `trigger()` boolean return. Used by notification recheck and login magic-link cooldown.

### Files created

- `hooks/useLocalStorageCooldown.ts`

### Files removed

- `hooks/useLocalStorageCooldown.js`

### Files modified

- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ReusableSmallComponents/buttons/LikesButtonAndLikesLogic.js` or `components/ReusableSmallComponents/IconWithCount.jsx`.

---

## 2026-06-07 — TypeScript: `LikesButtonAndLikesLogic`

### What was changed and why

Converted listing like button to `.tsx`. Exported `LikesButtonAndLikesLogicProps`; reuses `LikeableContent` and `LikeContentType` from the likes stack. Sign-in gate before `toggleLike`.

### Files created

- `components/ReusableSmallComponents/buttons/LikesButtonAndLikesLogic.tsx`

### Files removed

- `components/ReusableSmallComponents/buttons/LikesButtonAndLikesLogic.js`

### Files modified

- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx` or `components/ReusableSmallComponents/IconWithCount.jsx`.

---

## 2026-06-07 — TypeScript: `IconWithCount`

### What was changed and why

Converted icon + unread badge component to `.tsx` (default export still `IconBadge`). Exported `IconBadgeName` (`faBell` | `faHeart` | `thanks`) and `IconBadgeProps`. Used FontAwesome `SizeProp` for `iconSize`.

### Files created

- `components/ReusableSmallComponents/IconWithCount.tsx`

### Files removed

- `components/ReusableSmallComponents/IconWithCount.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `iconOpenCloseButton.jsx` or `ContainerForLikeShareFlag.jsx`.

---

## 2026-06-07 — TypeScript: thanks cat SVG icon

### What was changed and why

Converted `thanks.jsx` → `thanks.tsx`; removed unused `props` destructuring that forced `props={undefined}` hacks in TS consumers. Exported `ThanksIconProps` with optional `fill`.

### Files created

- `components/ReusableSmallComponents/iconsOrSvgImages/svgImages/thanks.tsx`

### Files removed

- `components/ReusableSmallComponents/iconsOrSvgImages/svgImages/thanks.jsx`

### Files modified

- `components/ReusableSmallComponents/IconWithCount.tsx`
- `components/Notifications/ThankNotificationListing.tsx`
- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `iconOpenCloseButton.jsx` or `components/Thanks/ThanksButton.jsx`.

---

## 2026-06-07 — TypeScript: `ProfileImage`

### What was changed and why

Converted profile avatar component to `.tsx` with optional `href` and `onClick`. Removed `href={undefined}` hacks from notification listing rows. `width` / `height` typed for Next.js `Image` (`number | \`${number}\``).

### Files created

- `components/ReusableSmallComponents/ProfileImage.tsx`

### Files removed

- `components/ReusableSmallComponents/ProfileImage.js`

### Files modified

- `components/Notifications/LikeNotificationListing.tsx`
- `components/Notifications/ThankNotificationListing.tsx`
- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `iconOpenCloseButton.jsx` or `ContainerForLikeShareFlag.jsx`.

---

## 2026-06-07 — TypeScript: `iconOpenCloseButton`

### What was changed and why

Converted notifications tab button to `.tsx`. Generic `IconOpenCloseButtonProps<T>` for tab `value` / `state`; `icon` typed as `IconBadgeName`. Tightened `NotificationTabConfig.icon` in `ToggleOneNotificationPage`.

### Files created

- `components/ReusableSmallComponents/buttons/iconOpenCloseButton.tsx`

### Files removed

- `components/ReusableSmallComponents/buttons/iconOpenCloseButton.jsx`

### Files modified

- `components/Notifications/ToggleOneNotificationPage.tsx`
- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `ContainerForLikeShareFlag.jsx` or `components/Thanks/ThanksButton.jsx`.

---

## 2026-06-07 — TypeScript: `ContainerForLikeShareFlag`

### What was changed and why

Converted shared like/share/thanks action chrome wrapper to `.tsx` with typed `children`.

### Files created

- `components/ReusableSmallComponents/buttons/ContainerForLikeShareFlag.tsx`

### Files removed

- `components/ReusableSmallComponents/buttons/ContainerForLikeShareFlag.jsx`

### Files modified

- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/Thanks/ThanksButton.jsx` or `ShareButton.jsx`.

---

## 2026-06-07 — TypeScript: `ThanksButton`

### What was changed and why

Converted listing thanks action button to `.tsx`. Typed `onClick`; added `aria-label`. Uses `ContainerForLikeShareFlag` + `thanks` icon.

### Files created

- `components/Thanks/ThanksButton.tsx`

### Files removed

- `components/Thanks/ThanksButton.jsx`

### Files modified

- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `ShareButton.jsx` or `hooks/useThanksHandler.js`.

---

## 2026-06-07 — TypeScript: `ShareButton`

### What was changed and why

Converted listing share toggle button to `.tsx`. Typed `onClickShowShares` as `MouseEventHandler<HTMLButtonElement>`; optional `shareIconStyling`. Removed unused `useState` import and unused `shares` destructuring (kept optional prop for future use).

### Files created

- `components/ReusableSmallComponents/buttons/ShareButton.tsx`

### Files removed

- `components/ReusableSmallComponents/buttons/ShareButton.jsx`

### Files modified

- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useThanksHandler.js` or `components/ShowingListOfContent/ContentListing.jsx`.
