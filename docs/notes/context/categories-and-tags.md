# Categories and tags context

Sources:

- [`context/CategoriesAndTagsContext.tsx`](../../../context/CategoriesAndTagsContext.tsx)
- [`hooks/useCategoriesForDataType.ts`](../../../hooks/useCategoriesForDataType.ts)

## Role

Root layout loads populated categories from Mongo ([`app/layout.tsx`](../../../app/layout.tsx) → [`CategTagsWrapper.tsx`](../../../wrappers/CategTagsWrapper.tsx)). Client components read them via `useCategAndTags()` or `useCategoriesForDataType(dataType)`. See [root-layout.md](../app/root-layout.md).

## Types

| Export | Notes |
|--------|-------|
| `CategoryTag` | `{ _id, tag }` — populated tag ref |
| `CategoryWithTags` | `{ _id, category, tags, order? }` |
| `CategoriesAndTagsContextValue` | `nameCateg`, `descrCateg`, `nameTagList`, `descriptionTagList` |
| `CategoriesForDataType` | `{ categoriesWithTags, tagList }` from the hook |

`tagList` entries use [`TagOption`](../../hooks/useTags.md) (`{ label, value }`), deduped by tag id.

## API route

[`GET /api/categories-and-tags`](../../../app/api/categories-and-tags/route.ts) — same shape as layout cache (`names`, `descriptions`). See [categories-and-tags-route.md](../app/api/categories-and-tags-route.md) for `revalidate`, populate, and code.

```ts
export type CategoriesAndTagsResponse = {
  names: CategoryWithTags[];
  descriptions: CategoryWithTags[];
};
```

Root layout duplicates this query in `getCategoriesAndTagsWithTTL()` ([`app/layout.tsx`](../../../app/layout.tsx)) and passes `nameCateg` / `descrCateg` into `CategTagsWrapper` — that is the main app path; the API route is the HTTP equivalent with Next `revalidate = 10800`.
