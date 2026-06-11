# `ContentListing`

Source: [`components/ShowingListOfContent/ContentListing.tsx`](../../../components/ShowingListOfContent/ContentListing.tsx)

## Role

Renders one name or description row on listing pages (`CoreListingPagesLogic`, profile pages, single-content pages).

## Props

| Prop | Notes |
|------|-------|
| `dataType` | `"names"` or `"descriptions"` |
| `singleContent` | `ContentListingItem` — likeable + editable listing shape |
| `mutate` | Optional SWR paginated cache updater (`swr` mode) |
| `mode` | `"swr"` (default) or `"standalone"` for single-content pages without SWR cache |

## Child flows

Delete / edit (creator menu), flag / suggest / thanks / likes / share (action row). Dialog state from `useDeleteConfirmation`, `useEditHandler`, `useFlagging`, `useSuggest`, `useThanksHandler`.
