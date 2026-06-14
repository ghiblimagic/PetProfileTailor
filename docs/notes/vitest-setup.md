# vitest.setup.ts

**Source:** [`vitest.setup.ts`](../../vitest.setup.ts)

Global Vitest setup run before every unit/component test file.

## What it does

1. **`@testing-library/jest-dom/vitest`** — registers DOM matchers (`.toBeInTheDocument()`, `.toHaveClass()`, etc.) on Vitest's `expect`. The package name still says "jest-dom"; the `/vitest` entry point wires matchers into Vitest instead of Jest.
2. **`TextEncoder` / `TextDecoder` polyfill** — required when tests import mongoose/mongodb

## TextEncoder polyfill

**Problem:** The default `jsdom` environment does not always expose `TextEncoder` and `TextDecoder` the way mongoose/mongodb expect. Node provides them in `util`. Without the polyfill, importing mongoose in a test can throw `ReferenceError: TextEncoder is not defined`.

**Fix:**

```ts
import { TextDecoder, TextEncoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });
```

## Per-file environment

[`utils/mongoDataCleanup.test.ts`](../../utils/mongoDataCleanup.test.ts) uses:

```ts
/**
 * @vitest-environment node
 */
```

Mongoose runs more cleanly in Node than jsdom for that suite (no DOM APIs needed).

## Config

[`vitest.config.ts`](../../vitest.config.ts) — `globals: true`, `jsdom` default, path aliases from `tsconfig.json`, excludes `e2e/`, `migrations/`, `codemods/`, `scripts/`.

## Related

- Design notes index: [`docs/README.md`](../README.md)
- Test commands: [`TESTING.md`](../../TESTING.md)
