# Fetch name page

Source: [`app/fetchname/page.tsx`](../../../app/fetchname/page.tsx)

## Role

Public `/fetchname` route. User types a name (max 50 chars), validation runs via `regexInvalidInput`, then [`CheckIfContentExists`](../../../components/AddingNewData/CheckIfContentExists.tsx) searches `/api/names/check-if-content-exists/[content]`.

## Client state

| State | Purpose |
|-------|---------|
| `nameCheck` | Controlled input value |
| `resetCheckContent` | Toggled on input change to reset duplicate-check UI |
| `checkIsProcessing` | Shared with `CheckIfContentExists` during fetch |
| `nameInvalidInput` | Invalid char list from `regexInvalidInput` |

No sign-in required (unlike `/addnames`).

## Related

- [check-if-content-exists.md](../components/check-if-content-exists.md)
- [add-content-forms.md](../components/add-content-forms.md) (`/addnames` full submit flow)
