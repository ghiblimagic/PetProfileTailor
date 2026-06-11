# Flag / report API routes

Sources:

- [`app/api/flag/flagreportsubmission/route.ts`](../../../../app/api/flag/flagreportsubmission/route.ts) — `POST` new report
- [`app/api/flag/getSpecificReport/route.ts`](../../../../app/api/flag/getSpecificReport/route.ts) — `GET` / `PUT` / `DELETE` current user's report
- [`app/api/user/reports/route.ts`](../../../../app/api/user/reports/route.ts) — `GET` active reports for `ReportsContext` (`UserReportsResponse`)

## UI consumers

[`AddReport.tsx`](../../../../components/Flagging/AddReport.tsx), [`EditReport.tsx`](../../../../components/Flagging/EditReport.tsx), [`ReportsContext.tsx`](../../../../context/ReportsContext.tsx).
