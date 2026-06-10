# user likes API route

`GET /api/user/likes` — [`route.ts`](../../../app/api/user/likes/route.ts)

## Purpose

Returns every name and description the signed-in user has liked. [`LikesContext`](../../../context/LikesContext.js) fetches this on session load and builds `Map`s keyed by `contentId` for `hasLiked()` / heart UI state.

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
- `context/LikesContext.js`, `wrappers/LikesWrapper.jsx`
