# user likes API route

`GET /api/user/likes` — [`route.ts`](../../../app/api/user/likes/route.ts)

## Purpose

Returns every name and description the signed-in user has liked. [`LikesContext.tsx`](../../../context/LikesContext.tsx) hydrates from server-prefetched data in [`app/layout.tsx`](../../../app/layout.tsx) (via [`getUserLikesForUserId`](../../../utils/api/getUserLikes.ts)); client login without a full reload still uses `GET /api/user/likes`.

## Shared fetch helper

[`utils/api/getUserLikes.ts`](../../../utils/api/getUserLikes.ts) — `getUserLikesForUserId(userId)` and `buildLikesMapsFromResponse(data)` used by the API route and root layout.

## `LikesProvider` / `useLikes`

On signed-in page load: root layout prefetches likes → `LikesWrapper initialLikes` → `likesRef` maps keyed by `contentId` before client fetch. Skips the first client `GET /api/user/likes` when prefetch ran; still fetches after client-only login/logout cycles.

`recentLikesRef` tracks per-`contentId` session deltas (`-1` | `0` | `1`) so optimistic like counts in [`useLikeState.ts`](../../../hooks/useLikeState.ts) survive navigation. `addLike` / `deleteLike` / `hasLiked` mutate the maps; mounted via [`LikesWrapper.tsx`](../../../wrappers/LikesWrapper.tsx) in [`app/layout.tsx`](../../../app/layout.tsx).

## Auth

`getServerSession(serverAuthOptions)` — 401 `{ error: "Not authenticated" }` when no session.

## Response

```json
{
  "names": [{ "id": "<likeDocId>", "contentId": "<nameId>" }],
  "descriptions": [{ "id": "<likeDocId>", "contentId": "<descriptionId>" }]
}
```

Parallel `find({ likedBy })` on `NameLike` and `DescriptionLike`, projection `{ contentId: 1, _id: 1 }`, via `leanWithStrings`.

## Related

- [togglelike-route.md](togglelike-route.md) — create/delete like docs
- [likes-and-follows.md](../models/likes-and-follows.md) — model fields
- `context/LikesContext.tsx`, `wrappers/LikesWrapper.tsx`
