# Testing

## Stack

- **Jest** — unit and integration tests
- **React Testing Library** — component tests
- **Playwright** — E2E tests

Vitest would have been easier to set up with TypeScript, but Jest was chosen for maturity, ecosystem, CI/coverage support, snapshots, and RTL's default pairing — experience that transfers to most existing codebases.

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run Jest once |
| `pnpm test:watch` | Jest watch mode |
| `pnpm test:ci` | Jest in CI with coverage |
| `pnpm test:e2e` | Playwright E2E (builds and starts app unless server already running) |

## Convert-then-test workflow

When converting files during the TypeScript migration:

1. Convert the file (`.js` → `.ts` or `.jsx` → `.tsx`)
2. Add or update tests for that file if it contains testable logic
3. Run `pnpm test` and `pnpm build` before merging

Do **not** block low-risk conversions on full coverage. Do **block** high-risk areas (`lib/auth.js`, rate limiter, ownership checks) without at least smoke tests.

## Where tests live

- Unit tests: co-located as `*.test.ts` next to the module (e.g. `utils/error.test.ts`)
- Component tests: co-located as `*.test.tsx` (e.g. `components/ui/skeleton.test.tsx`)
- E2E tests: `e2e/*.spec.ts`

## E2E notes

Playwright starts the app via `pnpm build && pnpm start`. For local runs, you can start `pnpm dev` or `pnpm start` first; Playwright reuses an existing server when not in CI.

Login E2E is a **smoke test** (page renders) — it does not require a test database or successful authentication.
