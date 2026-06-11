# `useSuggest`

Source: [`hooks/useSuggest.ts`](../../../hooks/useSuggest.ts)

## Role

Manages suggestion dialog visibility and the listing content passed to `SuggestionDialog`.

## API

| Return | Type | Notes |
|--------|------|-------|
| `showSuggestionDialog` | `boolean` | Dialog open state |
| `suggestionTarget` | `{ _id: string } \| null` | Full listing row passed to `SuggestionDialog` as `target` |
| `openSuggestion` | `(content) => void` | Called from `SuggestButton` with `singleContent` |
| `closeSuggestion` | `() => void` | Resets dialog + target |

## Consumer

[`ContentListing.jsx`](../../../components/ShowingListOfContent/ContentListing.jsx) — `SuggestButton` → `openSuggestion(content)` → `SuggestionDialog`.
