# updatefollows API route

Source: [`app/api/user/updatefollows/route.ts`](../../../app/api/user/updatefollows/route.ts)

## Overview

`PUT /api/user/updatefollows` — toggles a follow edge for the authenticated user. Called by [`FollowButton.tsx`](../../../components/Shared/content-actions/FollowButton.tsx).

## Request body

| Field | Type | Meaning |
|-------|------|---------|
| `userToFollowId` | string | User to follow or unfollow |
| `userFollowed` | boolean | **Current** UI state before toggle — `true` → unfollow (delete `Follow` doc), `false` → follow (upsert) |

`FollowButton` also sends `userId` in the body; the route uses `session.user.id` as `followedBy` (body `userId` is ignored).

## Auth & validation

1. `getSessionForApis` — 401 if not signed in
2. `User.findById(userToFollowId)` — 404 if target missing
3. Upsert or delete in `follows` collection (`models/Follow.ts`)

## Related

- [`getUserFollowers`](../../../utils/api/getUserFollowers.ts) — who follows a user
- [`getUserFollowing`](../../../utils/api/getUserFollowing.ts) — who a user follows
- E2E: `e2e/social.spec.ts`
