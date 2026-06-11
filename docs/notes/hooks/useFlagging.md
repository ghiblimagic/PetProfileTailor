# `useFlagging`

Source: [`hooks/useFlagging.ts`](../../../hooks/useFlagging.ts)

## Role

Manages flag/report dialog visibility and the listing content passed to `FlagDialog`.

## API

| Return | Type | Notes |
|--------|------|-------|
| `showFlagDialog` | `boolean` | Dialog open state |
| `flagTarget` | `{ _id: string } \| null` | Full listing row passed to `FlagDialog` as `target` |
| `openFlag` | `(content) => void` | Called from `FlagButton` with `singleContent` |
| `closeFlag` | `() => void` | Resets dialog + target |

## Consumer

[`ContentListing.tsx`](../../../components/ShowingListOfContent/ContentListing.tsx) — `FlagButton` → `openFlag(content)` → `FlagDialog` → `AddReport` / `EditReport`. Form notes: [flag-report-forms.md](../components/flag-report-forms.md).
