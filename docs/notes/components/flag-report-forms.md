# Flag report forms

Sources:

- [`components/Flagging/AddReport.tsx`](../../../components/Flagging/AddReport.tsx)
- [`components/Flagging/EditReport.tsx`](../../../components/Flagging/EditReport.tsx)

## Role

New and edit flows inside [`FlagDialog.tsx`](../../../components/Flagging/FlagDialog.tsx). `ReportsContext` is updated on submit (`addReport`) or delete (`deleteReport`).

## APIs

| Form | Method | Route |
|------|--------|-------|
| Add | POST | `/api/flag/flagreportsubmission` |
| Edit | PUT | `/api/flag/getSpecificReport` |
| Delete | DELETE | `/api/flag/getSpecificReport` |
| Load (edit) | GET | `/api/flag/getSpecificReport?contentId&userId&status=pending` |

## Shared types

`ReportContentInfo` (`{ _id, createdBy? }`) handles listing rows and profile pages where `createdBy` may be absent.
