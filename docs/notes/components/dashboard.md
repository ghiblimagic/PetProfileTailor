# `Dashboard`

Source: [`components/dashboard.tsx`](../../../components/dashboard.tsx)

## Role

Signed-in home: welcome header, [`PointSystemList`](../../../components/Ranking/PointSystemList.jsx) add counts, and [`ToggleOneContentPage`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx) for fav/added names and descriptions.

## Props (`DashboardProps`)

| Prop | Source | Used for |
|------|--------|----------|
| `namesCreated` | [`dashboard/page.tsx`](../../../app/(protected)/dashboard/page.tsx) | Points table names count |
| `createdDescriptions` | same | Points table descriptions count |

Fav Names / Fav Descriptions tabs load likes from [`LikesContext`](../../../context/LikesContext.tsx) via `useSwrPagination` (`restrictSwrToLikedNames`) — not from server props.

## Page

See [dashboard-page.md](../app/dashboard-page.md).

## Related

- [toggle-one-content-page.md](./toggle-one-content-page.md)
