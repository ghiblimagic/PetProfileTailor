# `/api/suggestion`

Source: [`app/api/suggestion/route.ts`](../../../../app/api/suggestion/route.ts)

## Methods

| Method | Purpose |
|--------|---------|
| POST | Create suggestion (`AddSuggestion`) |
| GET | Load pending suggestion for edit (`?contentId&status=pending`) |
| PUT | Update suggestion (`EditSuggestion`) |
| DELETE | Soft-delete (`status: deleted`, `outcome: deletedByUser`) |

## Related

- [`app/api/user/suggestions/route.ts`](../../../../app/api/user/suggestions/route.ts) — `GET` list for `SuggestionsContext` (`UserSuggestionsResponse`)
