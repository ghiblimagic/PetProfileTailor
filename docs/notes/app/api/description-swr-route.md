# description SWR API route

Source: [`app/api/description/swr/route.ts`](../../../app/api/description/swr/route.ts)

## Overview

`GET` / `POST` `/api/description/swr` — paginated descriptions for browse pages and `useSwrPagination`. Returns `{ data, totalPagesInDatabase, currentPage, totalDocs }`.

`PUT` / `DELETE` return 405.

## Request shape (differs slightly from names SWR)

| Concern | Behavior |
|---------|----------|
| **Pagination / sort** | Always from query string (`?page=`, `sortingproperty`, `sortingvalue`), even on POST |
| **Filters** (`tags`, `profileUserId`, `likedIds`) | POST JSON body when non-empty; otherwise built from query via `getAll` + CSV fallback |
| **GET** | Filters from query only |

Defaults: `page=1`, `sortingproperty=likedByCount`, `sortingvalue=-1`, `limit=50`.

### `likedIds`

Uses `buildSwrFilterSourceFromSearchParams` in [`parseNamesSwrRequest.ts`](../../../utils/api/parseNamesSwrRequest.ts):

- **Case 1:** `searchParams.getAll("likedIds")` — repeated params → `["abc", "def"]`
- **Case 2:** CSV fallback when `getAll` is empty — `?likedIds=1,2,3` → split on commas

Main app path: POST body array from `useSwrPagination` / `LikesContext` (same as names).

## Sort tiebreaker

When sorting by anything other than `_id`, aggregation adds `_id: 1` as a tiebreaker. See [names-swr-route.md](names-swr-route.md) for the full duplicate-pagination explanation.

## Related

- [`utils/api/parseNamesSwrRequest.ts`](../../../utils/api/parseNamesSwrRequest.ts) — shared SWR parsing helpers
- [`hooks/useSwrPagination.js`](../../../hooks/useSwrPagination.js) — client consumer
- [`app/api/names/swr/route.ts`](../../../app/api/names/swr/route.ts) — names counterpart (merges page into POST source)
