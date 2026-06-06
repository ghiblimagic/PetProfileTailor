# jest.setup.ts

**Source:** [`jest.setup.ts`](../../jest.setup.ts)

Global Jest setup run before every test file.

## What it does

1. **`@testing-library/jest-dom`** — extends Jest's `expect` with DOM-aware matchers like .toBeInTheDocument(), .toHaveTextContent(), .toBeVisible(), etc. Just importing it registers those matchers globally.
2. **`TextEncoder` / `TextDecoder` polyfill** — required when tests import mongoose/mongodb

## TextEncoder polyfill

**Problem:** Jest's default `jsdom` environment does not include `TextEncoder` and `TextDecoder`. Node.js provides them in the built-in `util` module. Mongoose and the MongoDB driver use these APIs internally, so importing mongoose in a test crashes with `ReferenceError: TextEncoder is not defined`.

**Fix:**
```
import { TextDecoder, TextEncoder } from "util";
```

1. Import `TextEncoder` and `TextDecoder` from `"util"`. Import the Node.js versions from "util" and put them onto the global object so they're available everywhere, just as they would be in a real browser or Node.js runtime

```
Object.assign(global, { TextDecoder, TextEncoder });
```
2. Assign them to `global` so they are available everywhere in the test run

## Related

- Design notes index: [`docs/README.md`](../README.md)
- Example consumer: [`utils/mongoDataCleanup.test.ts`](../../utils/mongoDataCleanup.test.ts) uses `@jest-environment node` to avoid mongoose/jsdom warnings for that suite
