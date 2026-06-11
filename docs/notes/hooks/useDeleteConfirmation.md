# `useDeleteConfirmation`

Source: [`hooks/useDeleteConfirmation.ts`](../../../hooks/useDeleteConfirmation.ts)

## Role

Delete dialog state for [`ContentListing.tsx`](../../../components/ShowingListOfContent/ContentListing.tsx).

## API

| Return | Notes |
|--------|-------|
| `openDelete` / `closeDelete` | Target row + dialog visibility |
| `confirmDelete(apiLink, userId, mutate?, setLocalData?)` | Optimistic delete; `mutate` for SWR list mode, `setLocalData` for `standalone` mode |

Exports `DeleteTarget` (`{ _id, content? }`) for [`DeleteDialog.tsx`](../../components/DeletingData/DeleteDialog.tsx).
