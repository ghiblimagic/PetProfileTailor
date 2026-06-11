# Thank, Suggestion, Report

Sources:

- [`models/Thank.ts`](../../models/Thank.ts)
- [`models/Suggestion.ts`](../../models/Suggestion.ts)
- [`models/Report.ts`](../../models/Report.ts)

## Overview

| Model | Purpose | Collection |
|-------|---------|------------|
| `Thank` | Thank-you notes on names/descriptions | `thanks` |
| `Suggestion` | User-suggested tag/category fixes | default (`suggestions`) |
| `Report` | Flag / moderation reports | default (`reports`) |

`Suggestion` and `Report` share moderation `status` / `outcome` enums and expose `fieldDescriptions` statics for admin UI labels.

## Thank

- `messages` must be tags from [`data/ThanksOptions.js`](../../data/ThanksOptions.js).
- `nameId` required when `contentType === "names"`; `descriptionId` when `contentType === "description"` (singular — matches legacy API/thanks route, not the `"descriptions"` enum value).
- Index `{ contentCreator, nameId, descriptionId, thanksBy }` for notification lookups.

**Routes:** `app/api/thanks`, `app/api/notifications/thanks`, `app/api/thanks/get-thanks-count`.

**UI:** [`ThanksButton.tsx`](../../components/Thanks/ThanksButton.tsx) on listing rows (`ContentListing`) → `useThanksHandler` dialog.

## Suggestion

Tag suggestion workflow: incorrect tags, suggested replacements, categories, optional `description` / `comments`.

**Routes:** `app/api/suggestion`, `app/api/user/suggestions`.

## Report

Stores a snapshot `contentCopy` of flagged content plus `reportCategories` and moderation fields.

**Routes:** `app/api/flag/flagreportsubmission`, `app/api/flag/getSpecificReport`, `app/api/user/reports`.

## `fieldDescriptions` statics

```typescript
Suggestion.fieldDescriptions.status; // "Current stage of moderation workflow"
Report.fieldDescriptions.priority;   // "How urgent or serious the report is"
```

Used by suggestion/report edit UI components.
