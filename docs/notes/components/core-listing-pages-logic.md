# `CoreListingPageLogic`

Source: [`components/CoreListingPagesLogic.tsx`](../../../components/CoreListingPagesLogic.tsx)

## Role

Shared listing shell:

1. Filter **drawer** + [`FilteringSidebar`](../../../components/Filtering/FilteringSidebar.tsx)
2. [`Pagination`](../../../components/ShowingListOfContent/pagination.tsx)
3. [`useSwrPagination`](../../../hooks/useSwrPagination.ts)
4. [`ContentListing`](../../../components/ShowingListOfContent/ContentListing.tsx) rows (sliced)

## Two layers of pagination

| Layer | Mechanism | Code location |
|-------|-----------|---------------|
| DB chunks (~50) | `size` / `setSize` on SWR infinite | `useSwrPagination` |
| UI pages (5–50) | `currentUiPage` + `.slice()` | below |

`itemsPerPage` → UI slice + `Pagination`. `itemsPerUiPage` (fixed `10`) → hook's `totalPagesInDatabase` only (legacy).

## Props

```tsx
// components/CoreListingPagesLogic.tsx
export type CoreListingPageLogicProps = {
  dataType: ContentType;
  swrForThisUserID?: string;       // profileUserId for SWR
  showHeader?: boolean;
  restrictSwrToLikedNames?: boolean;  // dashboard fav tabs
};
```

## SWR hook call

```tsx
// components/CoreListingPagesLogic.tsx
const {
  data,
  totalPagesInDatabase,
  totalItems,
  size,
  setSize,
  isLoading,
  isValidating,
  mutate,
} = useSwrPagination({
  dataType,
  currentUiPage,
  itemsPerUiPage,
  tags: triggerApplyFilters,
  sortingProperty,
  sortingValue,
  profileUserId: swrForThisUserID,
  restrictSwrToLikedNames,
});

const content: ContentListingItem[] = data ?? [];
```

## UI slice (current page only)

```tsx
// components/CoreListingPagesLogic.tsx
{content.length > 0 &&
  content
    .slice(
      currentUiPage - 1 === 0 ? 0 : (currentUiPage - 1) * itemsPerPage,
      currentUiPage * itemsPerPage,
    )
    .map((singleContent) => (
      <ContentListing
        dataType={dataType}
        singleContent={singleContent}
        key={singleContent._id}
        // VITAL — if key hasn't changed, react ignores mutation updates
        signedInUsersId={signedInUsersId}
        mutate={mutate}
      />
    ))}
```

## Filters & sort

```tsx
// components/CoreListingPagesLogic.tsx
const handleApplyFilters = (reset: boolean, quickSearchTags?: string[]) => {
  if (reset) {
    setFilterTagsIds([]);
    setTriggerApplyFilters([]);
  } else {
    startCooldown(filterCooldownRef, setRemainingFilterCooldown);
    setTriggerApplyFilters(quickSearchTags ?? filterTagsIds);
  }
  setCurrentUiPage(1);
  setSize(1);
};

// if users have changed how the items get sorted, then start over swr from page 1
useEffect(() => {
  setSize(1);
}, [sortingValue, sortingProperty]);

function setSortingLogicFunction(event: string) {
  const [property, value] = event.split(",");
  setSortingProperty(property);
  setSortingValue(Number(value));
  startCooldown(sortIntervalRef, setRemainingSortCooldown, 3);
}
```

Cooldown refs prevent overlapping intervals (`filterCooldownRef`, `sortIntervalRef`).

## Filter drawer

```tsx
// components/CoreListingPagesLogic.tsx
<Drawer
  open={isOpen}
  onClose={(_event, reason) => {
    if (reason === "backdropClick") {
      return;  // prevent closing when clicking on backdrop
    }
    toggleDrawer(false);
  }}
  sx={{
    "& .MuiDrawer-paper": {
      backgroundColor: "transparent",
      boxShadow: "none",
    },
  }}
>
  <FilteringSidebar ... />
</Drawer>
```

## Empty state

```tsx
{content.length === 0 && !isLoading ? (
  // copy uses restrictSwrToLikedNames ? "liked" : "created"
  <Image
    src="/digging-dog.svg"
    className="block mx-auto"
    // Image is wrapped in a span — block needed for mx-auto
  />
) : (
  // pagination + sliced ContentListing rows
)}
```

## Consumers

- [`app/fetchnames/page.tsx`](../../../app/fetchnames/page.tsx), [`app/fetchdescriptions/page.tsx`](../../../app/fetchdescriptions/page.tsx)
- [`ToggleOneContentPage.tsx`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx) — dashboard tabs
- [`profile.tsx`](../../../components/profile.tsx) — added content tabs

## Related

- [useSwrPagination.md](../hooks/useSwrPagination.md)
- [pagination.md](./pagination.md)
- [filtering-sidebar.md](./filtering-sidebar.md)
