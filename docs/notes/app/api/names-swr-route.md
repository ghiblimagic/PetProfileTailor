# names SWR API route

Source: [`app/api/names/swr/route.ts`](../../../app/api/names/swr/route.ts)

## Overview

`GET` / `POST` `/api/names/swr` — paginated names for browse pages and `useSwrPagination`. Returns `{ data, totalPagesInDatabase, currentPage, totalDocs }`.

## Request shape

| Source | Behavior |
|--------|----------|
| `GET` | All filters from query string; repeated keys become arrays |
| `POST` | JSON body for filters (`tags`, `profileUserId`, `likedIds`); query fills missing `page` / sort params |

Defaults: `page=1`, `sortingproperty=likedByCount`, `sortingvalue=-1`, `limit=50`.

### `likedIds` — where it comes from

Parsing lives in [`parseNamesSwrRequest.ts`](../../../utils/api/parseNamesSwrRequest.ts), not in `route.ts`.

| How the client sends it | What happens |
|-------------------------|--------------|
| **POST JSON body** (main path) | `useSwrPagination` puts `likedIds` in the POST body when filtering to liked content (`getLikedIds` from `LikesContext`). `mergePostBodyWithSearchParams` keeps that array; query string only fills missing keys like `page`. |
| **Case 1 — repeated GET params** | `?likedIds=abc&likedIds=def` → already an array of strings `["abc", "def"]` (from `searchParams.forEach` merging duplicate keys). |
| **GET single param** | `?likedIds=abc` → one string, wrapped as `["abc"]`. |
| **Case 2 — CSV fallback** (`likedCsv`) | If `likedIds` is still empty after Case 1, `searchParams.get("likedIds")` splits on commas (e.g. intended for `?likedIds=1,2,3` → `["1", "2", "3"]`). **Note:** when the param is already set by forEach (e.g. `?likedIds=a,b,c`), Case 2 does not run — you get `["a,b,c"]` as one entry (same as the old `route.js`). |

So in practice the dashboard “liked names only” filter uses **POST + body array**, not query-string CSV.

## Sort tiebreaker

When sorting by anything other than `_id`, aggregation adds `_id: 1` as a tiebreaker so items with equal sort values (e.g. same `likedByCount`) stay in a stable order across pages.

Each time the swr request is made, when items both have likedByCount = 0, the sort can return the items in different orders

By adding _id, its telling them to sort the items by _id too. This avoids duplicates entirely because it ensures the items on page 2, page 3 aren't sorted in a different order when they have the same likedByCount number.

### The Problem Without a Tiebreaker

The key insight: Without a unique field in your sort, documents with the same sortLogic value (like the same likedByCount) can be returned in non-deterministic order across different pages, causing duplicates or missing items.

Let's say you have 3 documents with the same likedByCount:

{ _id: "abc", content: "Name A", likedByCount: 5 }
{ _id: "def", content: "Name B", likedByCount: 5 }
{ _id: "xyz", content: "Name C", likedByCount: 5 }

With only { likedByCount: -1 }, MongoDB doesn't guarantee which order these 3 documents will be returned in. On page 1 you might get ABC, but on page 2 (after skip), you might get documents in a different order like BAC, causing "Name B" to appear on both pages.

### why I saw only 2 items duplicate out of the 185

Items that don't duplicate:

✅ Items with unique sort values (only one item has likedByCount = 7)
✅ Items within the same page boundary (items 5-10 all on page 1)
✅ Items where the "tie group" doesn't cross a page boundary

### Items that can duplicate:

❌ Multiple items with the same sort value that happen to fall right at a page boundary (like positions 48-52 when limit is 50)

### The 50 vs 200 Item Mystery
You mentioned there were no duplicates at limit 200. This makes perfect sense!
With limit 50:

More page boundaries = more chances for "tie groups" to be split across pages
Your duplicates were probably around items 48-52 or 98-102

#### With limit 200:

Fewer page boundaries = less chance a "tie group" gets split
The items that would duplicate at 50 per page are now safely within a single page

#### The Real Pattern
You likely have several items with likedByCount: 0 (or whatever your sort property is), and only the ones that were unlucky enough to be positioned right at a 50-item boundary got duplicated. The other 183 items either had unique values or weren't near boundaries.

That's why adding _id as a tiebreaker fixes it universally - even items with identical sort values now have a consistent, deterministic order regardless of where the page boundary falls!


## Related

- [`utils/api/parseNamesSwrRequest.ts`](../../../utils/api/parseNamesSwrRequest.ts) — pure parsing (unit tested)
- [`hooks/useSwrPagination.js`](../../../hooks/useSwrPagination.js) — client consumer
- [`e2e/browse.spec.ts`](../../../e2e/browse.spec.ts) — `_id` string shape smoke test
