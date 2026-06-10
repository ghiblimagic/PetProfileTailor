# names API route

Source: [`app/api/names/route.ts`](../../../app/api/names/route.ts)

## Overview

CRUD for pet names at `/api/names`. Used by `addingName.jsx` (POST), `ContentListing.jsx` (GET list + PUT edits), and `DeleteDialog.jsx` (DELETE).

## Handlers

| Method | Auth | Main checks |
|--------|------|-------------|
| `GET` | None | List all names with `createdBy` + `tags` populated |
| `POST` | Session | Length ≤50, blocklist, `findExactNormalized`, invalid chars, then create |
| `PUT` | Owner/admin | Blocklist (see note below), ownership, duplicate on rename, save |
| `DELETE` | None in route | Deletes by `contentId` (caller should gate in UI) |

## POST validation order

1. `getSessionForApis`
2. Length cap (50)
3. `checkMultipleFieldsBlocklist` on `content` + `notes`
4. `findExactNormalized` (409 if duplicate)
5. `regexInvalidInput` (400)
6. `normalizeString` + `Names.create`

## Related

- [`utils/api/validateNameSubmission.ts`](../../../utils/api/validateNameSubmission.ts) — length, blocklist guard, duplicate-on-update (unit tested)
- [`models/Name.ts`](../../../models/Name.ts)
- [`utils/stringManipulation/findNormalizedMatch.ts`](../../../utils/stringManipulation/findNormalizedMatch.ts)
- SWR listing: [`app/api/names/swr/route.ts`](../../../app/api/names/swr/route.ts) — [names-swr-route.md](names-swr-route.md)
- Check exists: [`app/api/names/check-if-content-exists/[content]/route.ts`](../../../app/api/names/check-if-content-exists/[content]/route.ts) — [check-if-content-exists.md](check-if-content-exists.md)
