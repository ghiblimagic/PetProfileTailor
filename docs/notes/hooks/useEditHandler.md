# `useEditHandler`

Source: [`hooks/useEditHandler.ts`](../../../hooks/useEditHandler.ts)

## Role

Manages edit-dialog visibility, target content, and PUT submission for listing rows (`ContentListing`).

## API

| Return | Type | Notes |
|--------|------|-------|
| `showEditDialog` | `boolean` | Dialog open state |
| `editTarget` | `{ _id: string } \| null` | Listing row being edited |
| `isSaving` | `boolean` | Save in progress |
| `openEdit` | `(content) => void` | Called from `EditButton` with full row |
| `closeEdit` | `() => void` | Resets dialog + target |
| `confirmEdit` | `(editedData) => Promise<void>` | PUT `{ submission: { contentId, content, notes, tags } }` |

## Options

| Option | Notes |
|--------|-------|
| `apiEndpoint` | `/api/names/` or `/api/description/` |
| `mutate` | Optional SWR cache updater (paginated `{ data: [] }` pages) |
| `setLocalData` | Always called with the updated item so re-open shows fresh data |

## Consumer

[`ContentListing.jsx`](../../../components/ShowingListOfContent/ContentListing.jsx) → [`EditContent.jsx`](../../../components/EditingData/EditContent.jsx).

## API routes

PUT handlers return `{ data: populatedDoc, message }` — see [`names/route.ts`](../../../app/api/names/route.ts) and [`description/route.ts`](../../../app/api/description/route.ts).
