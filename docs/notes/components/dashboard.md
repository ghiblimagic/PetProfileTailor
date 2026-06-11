# `Dashboard`

Source: [`components/dashboard.tsx`](../../../components/dashboard.tsx)

## Role

Signed-in home: welcome header, [`PointSystemList`](../../../components/Ranking/PointSystemList.jsx) add counts, and [`ToggleOneContentPage`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx) for fav/added names and descriptions.

## Props (`DashboardProps`)

| Prop | Source | Used for |
|------|--------|----------|
| `namesCreated` | `app/(protected)/dashboard/page.js` | Points table names count |
| `createdDescriptions` | same | Points table descriptions count |

Fav Names / Fav Descriptions tabs load likes from [`LikesContext`](../../../context/LikesContext.tsx) via `useSwrPagination` (`restrictSwrToLikedNames`) — not from server props.

## Page

[`app/(protected)/dashboard/page.js`](../../../app/(protected)/dashboard/page.js) — requires session; loads user-created names/descriptions from Mongo.

## Related

- [toggle-one-content-page.md](./toggle-one-content-page.md)
