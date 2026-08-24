# `ContentListing`

Source: [`components/ShowingListOfContent/ContentListing.tsx`](../../../components/ShowingListOfContent/ContentListing.tsx)

## Role

Renders one name or description row on listing pages ([`CoreListingPagesLogic.tsx`](../../../components/CoreListingPagesLogic.tsx), profile pages, single-content pages). Standalone pages: [name-page.md](../app/name-page.md), [description-page.md](../app/description-page.md). See [core-listing-pages-logic.md](./core-listing-pages-logic.md).

## Props

| Prop | Notes |
|------|-------|
| `dataType` | `"names"` or `"descriptions"` |
| `singleContent` | `ContentListingItem` — likeable + editable listing shape |
| `mutate` | Optional SWR paginated cache updater (`swr` mode) |
| `mode` | `"swr"` (default) or `"standalone"` for single-content pages without SWR cache |

## Child flows

Delete / edit (creator menu), flag / suggest / thanks / likes / share (action row). Dialog state from `useDeleteConfirmation`, `useEditHandler`, `useFlagging`, `useSuggest`, `useThanksHandler`.

## `text-left` on the root div

The root div carries an explicit `text-left`. This component is embedded
under very different ancestor trees — a plain page on `/fetchnames`, but
`components/dashboard.tsx`'s `text-center` on `/dashboard` (via
`ToggleOneContentPage` → `CoreListingPageLogic`) — and `text-align` inherits
through everything in between with nothing else resetting it. The
name/`@profileName` header row (`<a className="... flex flex-col ...">`)
is a flex-column container, so its `<span>`s stretch to the row's full
width by default (`align-items: stretch`); an inherited `text-center` then
centers the *text* inside each stretched span, visually pulling it away
from the profile image even though it's still the very next flex item. The
content/notes block below already had its own `text-left` for the same
reason — the header row didn't, which is what actually broke. `text-left`
on the root fixes it once for every element in the card, present or future,
regardless of what alignment an embedding page happens to set — don't rely
on a caller not setting `text-center` upstream.
