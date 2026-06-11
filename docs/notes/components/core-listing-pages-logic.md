# `CoreListingPageLogic`

Source: [`components/CoreListingPagesLogic.tsx`](../../../components/CoreListingPagesLogic.tsx)

## Role

Shared client shell for paginated name/description listings: filter drawer, pagination controls, SWR infinite scroll via [`useSwrPagination`](../../../hooks/useSwrPagination.js), and [`ContentListing`](../../../components/ShowingListOfContent/ContentListing.tsx) rows.

## Props (`CoreListingPageLogicProps`)

| Prop | Default | Purpose |
|------|---------|---------|
| `dataType` | — | `"names"` or `"descriptions"` |
| `swrForThisUserID` | `""` | Passed as `profileUserId` to SWR (profile “added” tabs) |
| `showHeader` | `true` | Show “Fetch Names/Descriptions” title |
| `restrictSwrToLikedNames` | `false` | Limit results to liked IDs from `LikesContext` |

## Consumers

- [`app/fetchnames/page.tsx`](../../../app/fetchnames/page.tsx), [`app/fetchdescriptions/page.tsx`](../../../app/fetchdescriptions/page.tsx)
- [`ToggleOneContentPage.tsx`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx) (dashboard liked/added tabs) — see [toggle-one-content-page.md](./toggle-one-content-page.md)

## Related

- Hook types: [`hooks/useSwrPagination.d.ts`](../../../hooks/useSwrPagination.d.ts)
- Row UI: [content-listing.md](./content-listing.md)
- Filter UI: `FilteringSidebar.jsx` (not yet TS)
