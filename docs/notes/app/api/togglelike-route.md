# togglelike API routes

Like / unlike with a Mongo transaction so `*Like` docs and `likedByCount` stay in sync.

## Routes

| Path | Source |
|------|--------|
| `POST /api/names/likes/[contentId]/togglelike` | [`names/.../route.ts`](../../../app/api/names/likes/[contentId]/togglelike/route.ts) |
| `POST /api/description/likes/[contentId]/togglelike` | [`description/.../route.ts`](../../../app/api/description/likes/[contentId]/togglelike/route.ts) |

Description route also returns **405** on `GET`.

## Request body

```json
{
  "contentCreator": {
    "_id": "...",
    "name": "...",
    "profileName": "...",
    "profileImage": "..."
  }
}
```

Only `contentCreator._id` is used (for `contentCreator` on the like doc and self-like `read` flag).

## Flow

1. `getSessionForApis` — 401 `"Unauthorized"` if not signed in
2. `findOne({ likedBy, contentId })` inside transaction
3. **Unlike:** delete like doc, `$inc: { likedByCount: -1 }`
4. **Like:** create like doc (`read: true` when liking own content), `$inc: { likedByCount: 1 }`
5. Response `{ liked: boolean }`

## Related

- [`docs/notes/models/likes-and-follows.md`](../models/likes-and-follows.md)
- [`GET /api/user/likes`](user-likes-route.md) — bulk fetch for `LikesContext`
- [`hooks/useLikeState.ts`](../../../hooks/useLikeState.ts) (uses [`useToggleState.ts`](../../../hooks/useToggleState.ts))
- [`LikesButtonAndLikesLogic.tsx`](../../../components/shared/content-actions/LikesButtonAndLikesLogic.tsx) — listing heart UI
- [`ContainerForLikeShareFlag.tsx`](../../../components/shared/content-actions/ContainerForLikeShareFlag.tsx) — shared action button chrome (like / share / thanks)
- [`ShareButton.tsx`](../../../components/shared/content-actions/ShareButton.tsx) — listing share toggle
- `e2e/helpers/likes.ts`
