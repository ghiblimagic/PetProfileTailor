# YouTube embed and social list modals

## `YoutubeEmbed`

Source: [`components/ShowingListOfContent/YoutubeEmbed.tsx`](../../../components/ShowingListOfContent/YoutubeEmbed.tsx)

Landing page (`app/page.js`) inline video player.

```tsx
export type YoutubeEmbedProps = {
  text: string;
  embedId: string;
  posterSrc: string;
  posterAlt: string;
  styling?: string;
  title: string;
  showVideoFunction: (open: boolean) => void;
};
```

```tsx
// app/page.tsx — one video open at a time via openVideo state
{openVideo === "impactful" && (
  <YoutubeEmbed
    text="Impactful"
    embedId="y5cx0MeHuE8"
    posterSrc="/impactful-poster.jpg"
    posterAlt="Preview of the Impactful pet bio video"
    styling="aspect-video"
    title="Fishtopher the cat gets adopted after going viral"
    showVideoFunction={() => setOpenVideo(null)}
  />
)}
```

### Special behavior

- **`use client`** — `useState` for the poster/play facade, the iframe's own `onLoad`, and a
  poster-image-failed fallback.
- **Facade pattern**: renders a static `posterSrc` image (`next/image`, `fill unoptimized`)
  with a play-button overlay first; the real `youtube-nocookie.com` iframe (with
  `?autoplay=1`) is only mounted once the poster is clicked. This replaced eagerly mounting the
  iframe on open, which loaded YouTube's own (often low-resolution/blurry) in-iframe thumbnail
  immediately — see the "Blurry video thumbnails" entry in `CHANGES.md`.
- If `posterSrc` 404s (e.g. the local file hasn't been supplied yet), falls back to YouTube's
  default thumbnail (`https://img.youtube.com/vi/{embedId}/hqdefault.jpg`) via the `<Image>`
  `onError` handler — no `next.config.js` domain allowlisting needed since `unoptimized` skips
  that check.
- Shows [`LoadingSpinner`](../ui/small-ui-components.md) until the iframe loads, once started.
- Close button is visible as soon as the panel mounts (poster or playing state).
- `showVideoFunction(false)` closes via parent state (not internal).

## `UsersFollowingList`

Source: [`components/ShowingListOfContent/UsersFollowingList.tsx`](../../../components/ShowingListOfContent/UsersFollowingList.tsx)

Full-screen modal listing users someone follows. Data shape: `FollowingUser[]` from [`getUserFollowing`](../../../utils/api/getUserFollowing.ts).

```tsx
export type UsersFollowingListProps = {
  setShowUsersListPage: (show: boolean) => void;
  userData: FollowingUser[];
  sessionFromServer: Session;
};
```

- Profile links: `NEXT_PUBLIC_BASE_FETCH_URL` + `profile/{profileName.toLowerCase()}`.
- Hides [`FollowButton`](../../../components/Shared/content-actions/FollowButton.tsx) when `person._id == sessionFromServer.user?.id`.
- Empty state: kitten/puppy [`GifHover`](../../../components/Shared/media/GifHover.tsx).

Currently wired in [`profile.tsx`](../../../components/profile.tsx) but **commented out** in JSX.

## `UsersFollowersList`

Source: [`components/ShowingListOfContent/UsersFollowersList.tsx`](../../../components/ShowingListOfContent/UsersFollowersList.tsx)

Same modal pattern for followers. Expects `userData.followers` as `FollowerUser[]` from [`getUserFollowers`](../../../utils/api/getUserFollowers.ts).

```tsx
export type UsersFollowersListUserData = { followers?: FollowerUser[] };
```

Follow button hidden for self; empty state matches following list.

## Related: single-open accordions elsewhere

`ToggleOneContentPage` (profile, dashboard) and `ToggleOneNotificationPage` (notifications) own their own open-state logic — see [toggle-one-content-page.md](../toggle-one-content-page.md).
