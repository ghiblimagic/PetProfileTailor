# `useSwrPagination`

Source: [`hooks/useSwrPagination.ts`](../../../hooks/useSwrPagination.ts)

## Role

SWR infinite hook for listing pages. Fetches **DB chunks** (~50 items per API page), flattens them into one array. [`CoreListingPagesLogic.tsx`](../../../components/CoreListingPagesLogic.tsx) **slices** that array for the UI page (5–50 items). UI page 1 ≠ SWR page 1.

## Why `useSWRInfinite`

```ts
// hooks/useSwrPagination.ts
// using useSWRInfinite since the array-of-pages behavior is handy for flattening
// the chunks of items, so that way the front end page 1 doesn't have to be equal
// to a swr page 1
// useSWR would instead return a single data object, which doesn't work in our
// case since we're letting users chose if they want to view 5,10,20,50 ect items at a time
```

## Types & exports

```ts
// hooks/useSwrPagination.ts
export type SwrPage = { data: ContentListingItem[]; totalDocs?: number };

export type UseSwrPaginationParams = {
  dataType: ContentType | string;
  currentUiPage: number;       // unused in hook — slice is in parent
  itemsPerUiPage: number;      // only for totalPagesInDatabase math
  tags?: string[];
  sortingProperty?: string;
  sortingValue?: number;
  contentIdentifier?: string;  // reserved, not wired
  profileUserId?: string;
  restrictSwrToLikedNames?: boolean;
};
```

## Fetcher (GET vs POST)

```ts
// hooks/useSwrPagination.ts
const fetcher = (key: SwrFetcherKey) => {
  let url: string;
  let options: SwrRequestOptions = {};
  if (Array.isArray(key)) {
    [url, options] = key;
  } else {
    url = key;
  }

  const hasBody = options?.body && Object.keys(options.body).length > 0;

  return fetch(url, {
    method: hasBody ? options?.method || "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  }).then((res) => res.json()) as Promise<SwrPage>;
};
```

POST is used when `tags`, `profileUserId`, or `likedIds` are in the body — keeps large liked-ID lists out of the query string.

## Liked-only early return

`useLikes()` is called **unconditionally** at hook top (rules of hooks). Original JS called it only inside `if (restrictSwrToLikedNames)`.

```ts
// hooks/useSwrPagination.ts
const { getLikedIds } = useLikes();

let likedIds: string[] | null = [];

if (restrictSwrToLikedNames) {
  likedIds = getLikedIds(dataType as LikeContentType) || null;
}

// if restrict to liked content but there are no likes, return early
if (shouldSkipSwrPaginationForLikes(restrictSwrToLikedNames, likedIds)) {
  return emptyResult;
}
```

## `buildSwrPaginationGetKey` — SWR page index vs API page

Extracted from the hook’s inline `getKey` for unit tests. Same behavior and comments.

```ts
// hooks/useSwrPagination.ts
export function buildSwrPaginationGetKey(
  index: number,
  previousPageData: SwrPage | null | undefined,
  params: SwrPaginationGetKeyParams,
): SwrFetcherKey | null {
  if (previousPageData && !previousPageData.data?.length) return null; // no more data
  if (index === undefined) return null; // stop fetching
  const page = index + 1; // SWR index starts at 0, but our API pages start at 1
  let url = "";
  if (params.dataType === "names") {
    url = `/api/names/swr?page=${page}&sortingproperty=${params.sortingProperty}&sortingvalue=${params.sortingValue}`;
  } else if (params.dataType === "descriptions") {
    url = `/api/description/swr?page=${page}&sortingproperty=${params.sortingProperty}&sortingvalue=${params.sortingValue}`;
  }
  // else if (params.dataType === "individualNames") {
  //   url = `/api/names/check-if-content-exists/${contentIdentifier}`;
  // }
  // POST in case likedIds is big; GET vs POST is decided in the fetcher
  const body: Record<string, unknown> = {};
  if (params.tags?.length) body.tags = params.tags;
  if (params.profileUserId) body.profileUserId = params.profileUserId;
  if (params.likedIds?.length || params.likedIds === null) body.likedIds = params.likedIds;

  return [url, Object.keys(body).length ? { body } : {}] as SwrFetcherKey;
}
```

The hook wraps this as `getKey` and passes `likedIds` from `useLikes()` when `restrictSwrToLikedNames` is set.

## SWR options

```ts
// hooks/useSwrPagination.ts
useSWRInfinite<SwrPage>(getKey, fetcher, {
  initialSize: 1,
  revalidateAll: false,
  revalidateOnMount: true,      // refetch 1st chunk when user navigates back via link
  revalidateFirstPage: false,   // don't refetch page 1 when setSize changes
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
});
```

## Flatten chunks → return value

```ts
// hooks/useSwrPagination.ts
const allItems = data ? data.flatMap((chunk) => chunk?.data ?? []) : [];
// (chunk?.data) prevents crash if a chunk is undefined

const totalItems = data?.[0]?.totalDocs || 0;
const totalPagesInDatabase = Math.ceil(totalItems / itemsPerUiPage);

return {
  data: allItems,
  isLoading: isLoading ?? !data,
  error,
  totalItems,
  totalPagesInDatabase,
  size,
  setSize,
  isValidating,
  mutate,  // passed to ContentListing — delete without full refresh
};
```

## Related

- [core-listing-pages-logic.md](../components/core-listing-pages-logic.md) — hook consumer + UI slice
- [pagination.md](../components/pagination.md) — `setSize` preload on top of this hook
- [names-swr-route.md](../app/api/names-swr-route.md), [description-swr-route.md](../app/api/description-swr-route.md)
