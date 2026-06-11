# `Pagination`

Source: [`components/ShowingListOfContent/pagination.tsx`](../../../components/ShowingListOfContent/pagination.tsx)

## Role

UI pagination bar: per-page select, sort dropdown, page-number window, next/prev arrows. **Preloads** the next SWR chunk via `setSize(size + 1)` so the `>` arrow does not flicker grey.

Works with [`useSwrPagination`](../../../hooks/useSwrPagination.ts): this component = **UI pages**; hook = **DB chunks** (~50 items).

## Props (how parent wires it)

```tsx
// components/CoreListingPagesLogic.tsx
<Pagination
  itemsPerPage={itemsPerPage}
  setItemsPerPageFunction={setItemsPerPageFunction}
  setSize={setSize}
  size={size}
  currentUiPage={currentUiPage}
  setCurrentUiPage={setCurrentUiPage}
  setSortingLogicFunction={setSortingLogicFunction}
  totalPagesInDatabase={totalPagesInDatabase}
  totalItems={totalItems}
  amountOfDataLoaded={data?.length}
  remainingSortCooldown={remainingSortCooldown}
  sortingValue={sortingValue}
  sortingProperty={sortingProperty}
  isValidating={isValidating}
/>
```

| Derived in this component | Formula |
|---------------------------|---------|
| `totalLoadedPages` | `ceil(amountOfDataLoaded / itemsPerPage)` |
| `windowEnd` | `min(windowStart + 5 - 1, totalLoadedPages)` |
| Item range label | `(currentUiPage-1)*itemsPerPage+1` … `min(currentUiPage*itemsPerPage, totalItems)` |

## `preLoadNextPage` — core preload logic

Pretend we're **2 pages ahead** so the next chunk loads before the user reaches the edge.

```tsx
// components/ShowingListOfContent/pagination.tsx
const preLoadNextPage = (overrides: PreLoadOverrides = {}) => {
  const currentPage = overrides.currentPage ?? currentUiPage;
  const loadedPages = overrides.totalLoadedPages ?? totalLoadedPages;
  const skipCooldown = overrides.skipCooldown ?? false;

  if (
    currentPage + 2 >= loadedPages &&
    loadedPages < totalPagesInDatabase
  ) {
    setSize(size + 1);
    if (!skipCooldown) {
      startCooldown(paginationCooldownRef, setRemainingPaginationCooldown, 15);
    }
  }
};
```

### Overrides fix (timing bug)

React state is async. When items-per-page changes, caller passes **future** `totalLoadedPages`:

```tsx
// resetItemsPerPage — after user picks new per-page value
const newTotalLoadedPages = Math.ceil(amountOfDataLoaded / newPerPage);

preLoadNextPage({
  currentPage: 1,
  totalLoadedPages: newTotalLoadedPages,
  skipCooldown: true,
});
```

**Without overrides:** 72 items, 50/page → stale `totalLoadedPages=5`, `1+2>=5` is false → no preload → one page button, grey `>`.

**With overrides:** `newTotalLoadedPages=1`, `1+2>=1` is true → preload works.

## Boundary `useEffect` (after filters)

When user is at the edge of loaded chunk data (e.g. 50 items in chunk 1, 50 per page) after **new filters**, chunk 2 may not arrive in time without this:

```tsx
// components/ShowingListOfContent/pagination.tsx
useEffect(() => {
  const calculatedTotalLoadedPages = Math.ceil(
    amountOfDataLoaded / itemsPerPage,
  );
  setTotalLoadedPages(calculatedTotalLoadedPages);

  if (
    currentUiPage + 1 >= calculatedTotalLoadedPages &&
    calculatedTotalLoadedPages < totalPagesInDatabase &&
    remainingPaginationCooldown === 0
  ) {
    preLoadNextPage({
      currentPage: currentUiPage,
      totalLoadedPages: calculatedTotalLoadedPages,
      skipCooldown: true,
    });
  }
}, [amountOfDataLoaded, itemsPerPage, currentUiPage, totalPagesInDatabase, remainingPaginationCooldown]);
```

## Page click & next arrow

```tsx
// Click a page number at the loaded edge → fetch more
const handleClickPage = (page: number) => {
  if (page >= totalLoadedPages && totalLoadedPages < totalPagesInDatabase) {
    setSize(size + 1);
  }
  setCurrentUiPage(page);
  updateWindow(page);
};

// Next arrow: move within loaded pages, then preload
const lastPageHandler = () => {
  if (remainingPaginationCooldown > 0 || isValidating) return;
  if (currentUiPage < totalLoadedPages) {
    updateWindow(currentUiPage + 1);
    setCurrentUiPage(currentUiPage + 1);
  }
  preLoadNextPage();
};
```

Next-arrow color (active = violet, else grey):

```tsx
color={`${
  (currentUiPage < totalLoadedPages && remainingPaginationCooldown === 0) ||
  (totalLoadedPages < totalPagesInDatabase && !isValidating && remainingPaginationCooldown === 0)
    ? "rgb(221 214 254)"
    : "grey"
}`}
```

## Max 50 per page (no 60)

DB chunk ≈ 60. **60/page + new filters** → only page 1, grey next, footer still `1-60 of 352`.

```tsx
// components/ShowingListOfContent/pagination.tsx
<select value={itemsPerPage} onChange={(e) => resetItemsPerPage(e.target.value)}>
  <option value="5">5</option>
  <option value="10">10</option>
  <option value="20">25</option>  {/* value/label mismatch — legacy */}
  <option value="30">30</option>
  <option value="40">40</option>
  <option value="50">50</option>
  {/* Max 50 — not 60 (DB chunk size) */}
</select>
```

Rejected alternatives: extra `useEffect` for 60-edge, callback ref + `setTimeout` from parent, parent loading extra chunk on filter apply.

## Related

- [core-listing-pages-logic.md](./core-listing-pages-logic.md)
- [useSwrPagination.md](../hooks/useSwrPagination.md)
