# check-if-content-exists API routes

Live duplicate / validation checks used by `CheckIfContentExists.js` while the user types or clicks search.

## Routes

| Path | Source | Match strategy |
|------|--------|----------------|
| `GET /api/names/check-if-content-exists/[content]` | [`names/.../route.ts`](../../../app/api/names/check-if-content-exists/[content]/route.ts) | Blocklist → invalid chars → exact normalized match (`^…$`) |
| `GET /api/description/check-if-content-exists/[content]` | [`description/.../route.ts`](../../../app/api/description/check-if-content-exists/[content]/route.ts) | Blocklist → `findStartNormalized` (prefix / start match, first 400 chars) |

## Response shapes

| `type` | HTTP | Meaning |
|--------|------|---------|
| `success` | 200 | No duplicate found |
| `duplicate` | 200 | Match found; `data` is populated document |
| `invalid` | 400 | Names only — bad characters |
| blocklist | 400 | `respondIfBlocked` message |

## Related

- [`utils/stringManipulation/findNormalizedMatch.ts`](../../../utils/stringManipulation/findNormalizedMatch.ts)
- E2E: `e2e/adddescriptions.spec.ts`, `e2e/helpers/seed-lookup.ts`
