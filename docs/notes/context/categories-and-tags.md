# Categories and tags context

Sources:

- [`context/CategoriesAndTagsContext.tsx`](../../../context/CategoriesAndTagsContext.tsx)
- [`hooks/useCategoriesForDataType.ts`](../../../hooks/useCategoriesForDataType.ts)

## Role

Root layout loads populated categories from Mongo (`app/layout.js` → [`CategTagsWrapper.js`](../../../wrappers/CategTagsWrapper.js)). Client components read them via `useCategAndTags()` or `useCategoriesForDataType(dataType)`.

## Types

| Export | Notes |
|--------|-------|
| `CategoryTag` | `{ _id, tag }` — populated tag ref |
| `CategoryWithTags` | `{ _id, category, tags, order? }` |
| `CategoriesAndTagsContextValue` | `nameCateg`, `descrCateg`, `nameTagList`, `descriptionTagList` |
| `CategoriesForDataType` | `{ categoriesWithTags, tagList }` from the hook |

`tagList` entries use [`TagOption`](../../hooks/useTags.md) (`{ label, value }`), deduped by tag id.

## API route

`GET /api/categories-and-tags` — same shape as layout cache (`names`, `descriptions`).
