# `useThanksHandler`

Source: [`hooks/useThanksHandler.ts`](../../../hooks/useThanksHandler.ts)

## Role

Manages thanks-dialog visibility and target content id for listing rows (`ContentListing`).

## API

| Return | Type | Notes |
|--------|------|-------|
| `showThanksDialog` | `boolean` | Dialog open state |
| `thanksTarget` | `string \| null` | Internal id for legacy `confirmThanks` only |
| `isSavingThanks` | `boolean` | Legacy save flag for `confirmThanks` |
| `openThanks` | `(contentId: string) => void` | Content `_id` from the listing row |
| `closeThanks` | `() => void` | Resets dialog + target |
| `confirmThanks` | `(thanksData) => Promise<void>` | Legacy PUT helper — not wired through `ThanksDialog` today (`AddThanks` POSTs directly) |

## Consumer

[`ContentListing.jsx`](../../../components/ShowingListOfContent/ContentListing.jsx) — `openThanks(singleContent._id)` → `ThanksDialog`.
