# notifications API routes

Paginated notification feeds for the signed-in user. All use [`getPaginatedNotifications`](../../../utils/api/getPaginatedNotifications.ts).

## Populate model imports

Mongoose `populate()` resolves `ref: "User"` etc. only if those models are registered via `mongoose.model()`. Import ref-target model files in any module that calls `.populate()` — even when the import looks unused. Pattern: `// necessary for populate` + `void ModelName`.

**Accidentally dropped during TS migration (restored):**

| File | Imports restored |
|------|------------------|
| `app/api/notifications/names/route.ts` | `Name`, `User` |
| `app/api/notifications/descriptions/route.ts` | `Description`, `User` |
| `app/api/notifications/thanks/route.ts` | `Description`, `User`, `Name` |
| `app/api/names/route.ts` | `NameTag`, `User` (had `NameTag` in JS) |
| `app/api/description/route.ts` | `DescriptionTag`, `User` (had `DescriptionTag` in JS) |
| `app/api/names/check-if-content-exists/.../route.ts` | `NameTag`, `User` |
| `utils/api/getUserFollowers.ts`, `getUserFollowing.ts` | `User` |
| `utils/stringManipulation/findNormalizedMatch.ts` | `User` |
| `app/(protected)/notifications/page.tsx` | `Name`, `User` |

**Already correct (unchanged):** `app/(protected)/dashboard/page.js` documents tag imports; legacy `.js` routes like `suggestion/route.js` still import ref models.

## Unread counts (`GET`)

| Path | Purpose |
|------|---------|
| `/api/user/notifications` | Parallel `countDocuments` for unread likes/thanks — feeds [`notificationsContext.tsx`](../../../context/notificationsContext.tsx) nav badge |

[`route.ts`](../../../app/api/user/notifications/route.ts): same self-action exclusion as list routes (`likedBy` / `thanksBy` `$ne userId` as ObjectId, `read: false`). Response: `{ names, descriptions, thanks }`.

## List routes (`GET`)

| Path | Model | Filter notes |
|------|-------|--------------|
| `/api/notifications/names` | `NameLike` | `contentCreator = user`, exclude self-likes (`likedBy $ne userId` as ObjectId) |
| `/api/notifications/descriptions` | `DescriptionLike` | Same as names |
| `/api/notifications/thanks` | `Thank` | `contentCreator = user` |

Query: `?page=1&limit=25` (defaults). Sort: unread first, then newest (`read: 1, createdAt: -1`).

### `$ne` + ObjectId (names / descriptions)

Mongoose auto-casts plain equality on `contentCreator`, but not always for `$ne` — pass `new ObjectId(session.user.id)` for both fields. See inline comments in [`names/route.ts`](../../../app/api/notifications/names/route.ts).

## Mark-read routes (`PATCH`)

| Path | Updates |
|------|---------|
| `/api/notifications/names/mark-read` | `NameLike` where `contentCreator` + `read: false` → `read: true` |
| `/api/notifications/descriptions/mark-read` | `DescriptionLike` |
| `/api/notifications/thanks/mark-read` | `Thank` |

## Testing

| Layer | What |
|-------|------|
| Unit | `utils/api/getPaginatedNotifications.test.ts` — `parseNotificationPagination` |
| E2E | `e2e/notifications.spec.ts` — 401, populate shape (`likedBy` / `contentId` objects), descriptions feed, names mark-read |
| E2E (related) | `e2e/social.spec.ts` — admin like appears in names list; self-like excluded |
| Manual | `TESTING.md` — thanks notifications, notifications **UI** tabs, mark-read in browser |

Populate regressions: E2E asserts `likedBy.profileName` and `contentId.content` are strings — fails if ref models are not imported in the route.

## Related

- [`docs/notes/models/likes-and-follows.md`](../models/likes-and-follows.md)
- [`app/(protected)/notifications/page.tsx`](../../../app/(protected)/notifications/page.tsx) — server-side prefetch ([notes](../notifications-page.md))
- E2E: `e2e/notifications.spec.ts`, `e2e/social.spec.ts`, `e2e/auth-session.spec.ts`
