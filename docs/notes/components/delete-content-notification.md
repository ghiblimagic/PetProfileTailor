# `DeleteContentNotification`

Source: [`components/DeletingData/DeleteContentNotification.tsx`](../../../components/DeletingData/DeleteContentNotification.tsx)

## Role

Reusable delete-confirmation modal body (trash icon + yes/no). Used by [`DeleteDialog.tsx`](../../../components/DeletingData/DeleteDialog.tsx) for content deletion and [`EditReport.tsx`](../../../components/Flagging/EditReport.tsx) for report deletion.

## Props

| Prop | Notes |
|------|-------|
| `setShowDeleteConfirmation` | Close handler; called with `false` |
| `onConfirm` | Runs delete action (caller owns API / cache updates) |
