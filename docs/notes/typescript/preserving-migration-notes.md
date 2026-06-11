# Preserving notes during JS → TS migration

When converting a module, **long behavioral comments from the original file belong in `docs/notes/`**, not only in git history.

## Convention

1. **Source file** — keep a one-line pointer at the top:
   ```ts
   /**
    * Short role summary.
    * Notes: docs/notes/…/module-name.md
    */
   ```
2. **Notes file** — capture:
   - **Role** and props/API tables (quick reference)
   - **Code excerpts** — copy the relevant functions/blocks from source into fenced blocks so readers don't bounce between md and `.ts`/`.tsx`. Prefix with `// path/to/file.ts` in the block. Trim only unrelated lines; keep comments that explain *why*.
   - **Architecture** — how it fits with neighbors (SWR chunks vs UI pages, context, API routes)
   - **Implementation notes** — preserved comments from the original `.js`/`.jsx`, rewritten as prose where needed (bug repro steps, “why not X”)
   - **Edge cases / bugs solved** — timing bugs, preload logic, rejected alternatives
3. **Inline comments** — re-add helpful originals in source (prop hints, JSX section labels, `// visible text`, accessibility notes). Move **long** paragraphs (multi-line bug essays) to the md file; keep a short pointer comment in source if useful.
4. **Index** — add or update a row in [`docs/README.md`](../../README.md).

## Recovering lost notes

If a file was converted before notes were expanded:

```bash
git show HEAD:path/to/original.js   # or git show <commit>^:path/…
```

Copy comment blocks into the matching `docs/notes/` file under **Implementation notes** or **Edge cases**.

## Listing stack example

| Source | Notes file |
|--------|------------|
| `hooks/useSwrPagination.ts` | [useSwrPagination.md](../hooks/useSwrPagination.md) |
| `components/ShowingListOfContent/pagination.tsx` | [pagination.md](../components/pagination.md) |
| `components/Filtering/FilteringSidebar.tsx` | [filtering-sidebar.md](../components/filtering-sidebar.md) |
| `components/CoreListingPagesLogic.tsx` | [core-listing-pages-logic.md](../components/core-listing-pages-logic.md) |
