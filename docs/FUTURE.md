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

## Follow / unfollow via UI (Playwright E2E)

**Status:** Deferred — re-enable follow UI on profile first, then add E2E

**Today**

- [`FollowButton.tsx`](../components/Shared/content-actions/FollowButton.tsx) exists and calls `PUT /api/user/updatefollows/` (hidden checkbox + axios).
- [`UsersFollowingList.tsx`](../components/ShowingListOfContent/UsersFollowingList.tsx) and [`UsersFollowersList.tsx`](../components/ShowingListOfContent/UsersFollowersList.tsx) render `FollowButton` per row — wiring in [`profile.tsx`](../components/profile.tsx) is **commented out** (see [youtube-and-social-lists.md](notes/components/showing-list-of-content/youtube-and-social-lists.md)).
- **API-only E2E** already covers follow edges: `e2e/social.spec.ts` — admin follow via API, `grabusersfollowing` lists followed users. No browser click on `FollowButton` yet.
- Manual checklist: [`TESTING.md`](../TESTING.md) — “Profile follow / unfollow via **UI**” remains open.

**When follow UI is re-added**

1. Uncomment / restore followers and following modals on profile (or equivalent surface where `FollowButton` is exposed).
2. Add Playwright coverage in `e2e/social.spec.ts` (or `e2e/follow.spec.ts` if the flow grows):
   - Sign in as admin (or seeded user) → open profile → followers/following list → click follow → assert `PUT /api/user/updatefollows/` 200 and UI state (checkbox / label).
   - Click again → unfollow → assert `Follow` doc removed (`grabusersfollowing` or list no longer includes target).
   - Logged-out or self-profile: follow control hidden or gated (match `FollowButton` + list rules).
3. Optional unit/component: `FollowButton` with mocked axios + session (initial state from `data.followers`).

**Likely touch points**

- `components/profile.tsx` — re-enable list modals
- `components/ShowingListOfContent/UsersFollowingList.tsx`, `UsersFollowersList.tsx`
- `components/Shared/content-actions/FollowButton.tsx`
- `docs/notes/app/api/updatefollows-route.md`, `docs/notes/components/reusable-buttons.md`
- `e2e/social.spec.ts`, `e2e/helpers/` (follow button locator helpers)

---

_Add new sections below as other post-migration ideas come up._
