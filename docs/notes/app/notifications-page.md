# notifications page

Server page: `app/(protected)/notifications/page.tsx`. Client tabs: `components/Notifications/ToggleOneNotificationPage.tsx`. Requires sign-in; redirects to `/login` when there is no session.

## Data flow

1. `getServerSession(serverAuthOptions)` — session user id drives queries.
2. `getPaginatedNotifications(NameLike, …)` — prefetches page 1 of name-like notifications for the **names** tab.
3. `ToggleOneNotificationPage` — client component; uses `initialNamesDocs` as SWR `initialPage` for names. Descriptions and thanks load lazily via `/api/notifications/*` when their tabs open.

## `ToggleOneNotificationPage` (client)

| Tab | SWR key | Fetch timing |
|-----|---------|--------------|
| Names | `names` | Always mounted; `initialPage` from SSR; `revalidateOnMount: false` |
| Descriptions | `descriptions` | `enabled` only when tab open |
| Thanks | `thanks` | `enabled` only when tab open |

Hooks stay mounted when switching tabs so SWR cache and pagination (`size`) persist.

### `NotificationsProvider` / `useNotifications`

[`context/notificationsContext.tsx`](../../../context/notificationsContext.tsx) wraps the app (via `NotificationWrapper`). On session load it `GET`s `/api/user/notifications` for unread counts (`names`, `descriptions`, `thanks`). `resetNotificationType(type)` fires `PATCH /api/notifications/{type}/mark-read` and zeros that badge in local state.

### Unread badge → mark-read

`useNotifications()` supplies unread counts from `/api/user/notifications`. When a tab with a non-zero count is open:

1. Wait until that tab’s SWR finishes loading.
2. Wait 3 seconds (user can read rows).
3. Call `resetNotificationType(type)` → `PATCH /api/notifications/{type}/mark-read` and zero the badge.

Effect cleanup sets `canceled = true` if the user switches tabs before the timer finishes, so unread counts on other tabs are not cleared early.

### Listing children

| Tab | Component |
|-----|-----------|
| Names / Descriptions | `LikeNotificationListing` (`LikesContentListing`) |
| Thanks | `ThankNotificationListing` (`ThanksContentListing`) |

Shared list UI: `NotifListingWrapper` (load more, recheck cooldown, empty state).

### `useSWRSimple` hook

[`hooks/useSwrSimple.ts`](../../../hooks/useSwrSimple.ts) wraps `useSWRInfinite` against `/api/notifications/{type}?page=&limit=25`. `getKey` returns `null` when `enabled: false` (lazy tabs) or when the previous page was empty (end of list). `initialPage` seeds `fallbackData` for SSR prefetch on the names tab.

## Populate model imports

Same rule as [notifications-routes.md](api/notifications-routes.md): import `User` and `Name` so Mongoose can resolve `likedBy` and `contentId` refs on `NameLike`.

## Difference from names API route

The page filter is `{ contentCreator: userId }` only. `/api/notifications/names` also excludes self-likes (`likedBy: { $ne: userId }`). SSR prefetch may include self-likes; client SWR revalidation uses the API filter.

## Testing

| Layer | What |
|-------|------|
| E2E | `e2e/auth-session.spec.ts` — `/notifications` loads when logged in |
| E2E | `e2e/notifications.spec.ts` — API populate + mark-read (not full UI tabs) |
| Manual | `TESTING.md` — notifications UI tabs, mark-read in browser |
