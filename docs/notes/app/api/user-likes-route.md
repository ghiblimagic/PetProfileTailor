# user likes API route

`GET /api/user/likes` — [`route.ts`](../../../app/api/user/likes/route.ts)

## Purpose

Returns every name and description the signed-in user has liked. [`LikesContext.tsx`](../../../context/LikesContext.tsx) fetches this on session load and builds `Map`s keyed by `contentId` for `hasLiked()` / heart UI state.

## `LikesProvider` / `useLikes`

On session load: `GET /api/user/likes` → `likesRef.current.names` / `.descriptions` as `Map<contentId, null>`. `recentLikesRef` tracks per-`contentId` session deltas (`-1` | `0` | `1`) so optimistic like counts in [`useLikeState.ts`](../../../hooks/useLikeState.ts) survive navigation. `addLike` / `deleteLike` / `hasLiked` mutate the maps; mounted via [`LikesWrapper.tsx`](../../../wrappers/LikesWrapper.tsx) in [`app/layout.tsx`](../../../app/layout.tsx).

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
