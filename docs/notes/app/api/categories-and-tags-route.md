# Categories and tags API route

Source: [`app/api/categories-and-tags/route.ts`](../../../app/api/categories-and-tags/route.ts)

## Overview

`GET /api/categories-and-tags` — populated name/description categories for filters, tag pickers, and admin. Same JSON shape as root layout’s in-memory cache.

## Response type

```ts
export type CategoriesAndTagsResponse = {
  names: CategoryWithTags[];
  descriptions: CategoryWithTags[];
};
```

`CategoryWithTags` from [`CategoriesAndTagsContext.tsx`](../../../context/CategoriesAndTagsContext.tsx): `{ _id, category, tags: [{ _id, tag }], order? }`.

## Handler

```ts
// Control revalidation (cache TTL in seconds)
export const revalidate = 10800; // cache for 3 hours

export async function GET() {
  await dbConnect.connect(); // global mongoose connection

  const [nameCategories, descCategories] = await Promise.all([
    leanWithStrings(NameCategory.find().populate("tags").sort({ order: 1 })),
    leanWithStrings(
      DescriptionCategory.find().populate("tags").sort({ order: 1 }),
    ),
  ]);

  return NextResponse.json({
    names: nameCategories,
    descriptions: descCategories,
  });
}
```

### Special behavior: Next.js cache (`revalidate`)

`export const revalidate = 10800` — route response may be cached by Next for **3 hours** (matches build output `Revalidate 3h`). Public read-only data; tags/categories change infrequently.

This is separate from the **layout** TTL cache in [`app/layout.tsx`](../../../app/layout.tsx) (`getCategoriesAndTagsWithTTL` — also 3 hours in memory). Layout hydrates [`CategTagsWrapper`](../../../wrappers/CategTagsWrapper.tsx) → `CategoriesAndTagsProvider` on every page load; this API is for clients that fetch categories directly (or tooling).

### Special behavior: populate + sort

- `NameCategory` / `DescriptionCategory` models register tag refs via side-effect imports in model files (`NameTag`, `DescriptionTag`).
- `.populate("tags")` — full tag documents `{ _id, tag }` on each category.
- Name categories: `.sort({ order: 1 })` — admin `order` field controls filter drawer sequence.
- `leanWithStrings` — ObjectIds → strings, drops `__v`.

### Errors

500 + `{ error: "Internal Server Error" }` on DB failure; logged with `console.error`.

## Consumers

- [`CategoriesAndTagsContext`](../../../context/CategoriesAndTagsContext.tsx) — primary path is **layout SSR**, not this route
- [`useCategoriesForDataType`](../../../hooks/useCategoriesForDataType.ts) — filter sidebar, tag pickers
- [`FilteringSidebar`](../../../components/Filtering/FilteringSidebar.tsx) — quick-filter tag IDs are hardcoded; category checkboxes use context data

## Related

- [categories-and-tags.md](../../context/categories-and-tags.md)
- [filtering-sidebar.md](../../components/filtering-sidebar.md)
