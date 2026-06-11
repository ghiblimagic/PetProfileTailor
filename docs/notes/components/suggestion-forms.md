# Suggestion forms

Sources:

- [`components/Suggestions/AddSuggestion.tsx`](../../../components/Suggestions/AddSuggestion.tsx)
- [`components/Suggestions/EditSuggestion.tsx`](../../../components/Suggestions/EditSuggestion.tsx)

## Role

New and edit flows inside [`SuggestionDialog.tsx`](../../../components/Suggestions/SuggestionDialog.tsx). `SuggestionsContext` is updated on submit (`addSuggestion`) or delete (`deleteSuggestion`).

## APIs

| Form | Method | Route |
|------|--------|-------|
| Add | POST | `/api/suggestion` |
| Edit | PUT | `/api/suggestion` |
| Delete | DELETE | `/api/suggestion` |
| Load (edit) | GET | `/api/suggestion?contentId&status=pending` |

## Shared types

`SuggestionContentInfo` (`{ _id, createdBy, tags?, notes? }`) is passed from [`useSuggest.ts`](../../../hooks/useSuggest.ts) via full listing rows.
