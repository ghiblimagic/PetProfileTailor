# CheckIfContentExists

Source: [`components/AddingNewData/CheckIfContentExists.tsx`](../../../components/AddingNewData/CheckIfContentExists.tsx)

## Role

Client duplicate-check UI: user clicks Search, component fetches `apiString + content` (first 400 chars of controlled or internal value). Used on add-name, add-description, and fetchname flows.

## Props (`CheckIfContentExistsProps`)

| Prop | Purpose |
|------|---------|
| `apiString` | Base URL, e.g. `/api/names/check-if-content-exists/` |
| `contentType` | `"names"` or `"descriptions"` — heading copy only |
| `value` / `onChange` | Optional controlled input (fetchname uses internal state) |
| `resetTrigger` | Parent toggles to clear message and duplicate preview |
| `addNamesPage` | When true, shows message and optional duplicate `ContentListing` |
| `showFullContent` | Initial state for show/hide duplicate preview |
| `invalidInput` | Disables search when validation failed |
| `checkIsProcessing` / `setCheckIsProcessing` | Optional loading guard shared with parent form |

## API

See [`docs/notes/app/api/check-if-content-exists.md`](../app/api/check-if-content-exists.md). Response typed locally as `CheckContentExistsResponse` (`type`: `duplicate` | `success` | `invalid`; optional `message`, `data`, `error`).

## Consumers

- [`addingName.tsx`](../../../components/AddingNewData/addingName.tsx)
- [`addingdescription.tsx`](../../../components/AddingNewData/addingdescription.tsx)
- [`app/fetchname/page.tsx`](../../../app/fetchname/page.tsx)

## Notes

- `contentCheck` uses `(externalValue ?? internalContent).slice(0, 400)` so undefined controlled value does not throw.
- Duplicate preview passes `dataType="names"` to `ContentListing` (legacy behavior).
