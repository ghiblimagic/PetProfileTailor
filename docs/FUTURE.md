# Future plans

Ideas deferred until after the **TypeScript migration** is in a stable place. Not committed work — use this as a backlog when picking post-migration improvements.

---

## Likes: server prefetch → seed `LikesProvider` (Option B)

**Status:** Done (2026-06-07) — see [`CHANGES.md`](../CHANGES.md) and [user-likes-route.md](notes/app/api/user-likes-route.md).

---

## `ShowTime` + content created dates

**Status:** Revisit (post–TS migration)

**Today**

- [`ShowTime.tsx`](../components/Shared/media/ShowTime.tsx) exists but has **no imports**.
- [`ContentListing.tsx`](../components/ShowingListOfContent/ContentListing.tsx) shows creator `ProfileImage` + name + `@profileName` from populated `createdBy` — **no** `createdAt` / timestamp on listing rows.
- [`LikeNotificationListing.tsx`](../components/Notifications/LikeNotificationListing.tsx) and [`ThankNotificationListing.tsx`](../components/Notifications/ThankNotificationListing.tsx) format `createdAt` inline with `toLocaleString`, not `ShowTime`.
- Removed unused `PostersImageUsernameProfileName` (superseded by `ContentListing` inline markup).

**Options to decide**

1. Add `ShowTime` to `ContentListing` when `createdAt` is on the listing item (confirm API/SWR shape includes it).
2. Refactor notification listings to use `ShowTime` for consistent locale + `suppressHydrationWarning`.
3. Extract a small shared “author row” from `ContentListing` if the header block grows again — only if it reduces duplication without over-abstracting.

**Likely touch points**

- `components/ShowingListOfContent/ContentListing.tsx`
- `components/Notifications/LikeNotificationListing.tsx`, `ThankNotificationListing.tsx`
- `docs/notes/components/content-listing.md`, `reusable-small-components.md`

---

_Add new sections below as other post-migration ideas come up._
