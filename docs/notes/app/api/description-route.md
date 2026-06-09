# description API route

Source: [`app/api/description/route.ts`](../../../app/api/description/route.ts)

## Overview

CRUD for descriptions at `/api/description`. Mirror of [`names/route.ts`](../../../app/api/names/route.ts) with duplicate-check helpers and slightly different auth error shapes (`new Response("Unauthorized")` on some paths).

## Handlers

| Method | Auth | Main checks |
|--------|------|-------------|
| `GET` | None | List all with `createdBy` + `tags` populated |
| `POST` | Session | Blocklist, `checkDuplicateDescription`, create with normalized slice (400 chars) |
| `PUT` | Owner/admin | Blocklist + duplicate when `content \|\| notes`, ownership, update |
| `DELETE` | Owner/admin | `findById`, ownership, `deleteOne` |

## Helpers

- [`utils/api/descriptionDuplicateCheck.ts`](../../../utils/api/descriptionDuplicateCheck.ts) — when to query + 409 payload (unit tested)
- `checkDuplicateDescription` in route — calls `findExactNormalized` then `duplicateDescriptionConflict`

## Related

- [`models/Description.ts`](../../../models/Description.ts)
- SWR listing: [`app/api/description/swr/route.js`](../../../app/api/description/swr/route.js)
- Check exists: [`app/api/description/check-if-content-exists/[content]/route.js`](../../../app/api/description/check-if-content-exists/[content]/route.js)
