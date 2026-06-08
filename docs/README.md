# Code notes

Heavy design and learning notes for converted TypeScript modules live here so source files stay readable.

## Conventions

| Doc type | Location | Example |
|----------|----------|---------|
| Module design notes | `docs/notes/<path>/<module>.md` | `docs/notes/utils/mongoDataCleanup.md` for `utils/mongoDataCleanup.ts` |
| Operational changelog | [`CHANGES.md`](../CHANGES.md) | What changed, when, verification |
| Testing | [`TESTING.md`](../TESTING.md) | Automated + manual verification checklists |

Each source file with notes should have a one-line pointer at the top linking to its markdown file.

## Index

| Source | Notes |
|--------|-------|
| [`utils/mongoDataCleanup.ts`](../utils/mongoDataCleanup.ts) | [mongoDataCleanup.md](notes/utils/mongoDataCleanup.md) |
| [`jest.setup.ts`](../jest.setup.ts) | [jest-setup.md](notes/jest-setup.md) |
| [`lib/auth.ts`](../lib/auth.ts) | [auth.md](notes/lib/auth.md) |
