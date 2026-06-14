# YouTube embed and social list modals

## `YoutubeEmbed`

Source: [`components/ShowingListOfContent/YoutubeEmbed.tsx`](../../../components/ShowingListOfContent/YoutubeEmbed.tsx)

Landing page (`app/page.js`) inline video player.

```tsx
export type YoutubeEmbedProps = {
  embedId: string;
  styling?: string;
  title: string;
  showVideoFunction: (open: boolean) => void;
};
```

```tsx
// app/page.js — one video open at a time via openVideo state
{openVideo === "impactful" && (
  <YoutubeEmbed
    embedId="y5cx0MeHuE8"
    styling="aspect-video"
    title="Fishtopher the cat gets adopted after going viral"
    showVideoFunction={() => setOpenVideo(null)}
  />
)}
```

### Special behavior

- **`use client`** — `useState` for iframe `onLoad`.
- Shows [`LoadingSpinner`](../ui/small-ui-components.md) until iframe loads; iframe and close button hidden until then.
- Uses `youtube-nocookie.com` embed URL.
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
- Hides [`FollowButton`](../../../components/shared/content-actions/FollowButton.tsx) when `person._id == sessionFromServer.user?.id`.
- Empty state: kitten/puppy [`GifHover`](../../../components/shared/media/GifHover.tsx).

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
