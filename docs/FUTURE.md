# Future plans

Ideas deferred until after the **TypeScript migration** is in a stable place. Not committed work — use this as a backlog when picking post-migration improvements.

---

## Likes: server prefetch → seed `LikesProvider` (Option B)

**Status:** Planned (post–TS migration)

**Problem today**

- [`LikesContext.tsx`](../context/LikesContext.tsx) loads likes in a client `useEffect` via `GET /api/user/likes`.
- Signed-in users can see a brief wrong state on heart icons until that fetch completes.
- The old [`app/fetchnames`](../app/fetchnames/page.tsx) page once prefetched `NameLikes` and passed props to `CoreListingPageLogic`, but those props were **never read** — removed during TS conversion (see `CHANGES.md` fetchnames entry). Do **not** revive that pattern.

**Proposed approach**

1. Fetch likes on the **server** in a shared layout (root or a wrapper used on pages with like buttons), using the same data shape as [`app/api/user/likes/route.ts`](../app/api/user/likes/route.ts) / `UserLikesResponse`.
2. Extend [`LikesProvider`](../context/LikesContext.tsx) (via [`LikesWrapper.tsx`](../wrappers/LikesWrapper.tsx)) to accept optional `initialLikes`.
3. On mount: if `initialLikes` is present, hydrate `likesRef` immediately; still refetch or merge after client toggles so session deltas stay correct.
4. Keep **one source of truth** — do not add a separate page-level `NameLikes` prefetch on `/fetchnames` or listing pages.

**Benefits**

- Correct heart state on first paint for logged-in users.
- One fewer client round trip on common routes.
- Aligns with App Router (server data → client provider).

**Costs / risks**

- Layout-level query on every wrapped page (consider gating or caching).
- Server session vs client `useSession` must agree on login/logout.
- Invalidation when user toggles a like on the same page.

**Likely touch points**

- `app/layout.tsx` (or layout that already wraps `LikesWrapper`)
- `context/LikesContext.tsx`, `wrappers/LikesWrapper.tsx`
- `app/api/user/likes/route.ts` (shared fetch helper usable from server + route)
- `docs/notes/app/api/user-likes-route.md`

**Out of scope for this item**

- Prefetching likes into `CoreListingPageLogic` props (public `/fetchnames` browse does not filter by likes).
- Replacing client `LikesContext` fetch entirely without a toggle/invalidation story.

---

## `ShowTime` + content created dates

**Status:** Revisit (post–TS migration)

**Today**

- [`ShowTime.tsx`](../components/ReusableSmallComponents/ShowTime.tsx) exists but has **no imports**.
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
