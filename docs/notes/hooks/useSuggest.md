# `useSuggest`

Source: [`hooks/useSuggest.ts`](../../../hooks/useSuggest.ts)

## Role

Manages suggestion dialog visibility and the listing content passed to `SuggestionDialog`.

## API

| Return | Type | Notes |
|--------|------|-------|
| `showSuggestionDialog` | `boolean` | Dialog open state |
| `suggestionTarget` | `SuggestionContentInfo \| null` | Full listing row passed to `SuggestionDialog` as `target` |
| `openSuggestion` | `(content: SuggestionContentInfo) => void` | Called from `SuggestButton` with `singleContent` |
| `closeSuggestion` | `() => void` | Resets dialog + target |

## Consumer

[`ContentListing.tsx`](../../../components/ShowingListOfContent/ContentListing.tsx) — `SuggestButton` → `openSuggestion(content)` → `SuggestionDialog` → `AddSuggestion` / `EditSuggestion`. Form notes: [suggestion-forms.md](../components/suggestion-forms.md).
