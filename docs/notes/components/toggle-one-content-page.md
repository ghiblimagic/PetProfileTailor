# `ToggleOneContentPage`

Source: [`components/ShowingListOfContent/ToggleOneContentPage.tsx`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx)

## Role

Tab strip that mounts one [`CoreListingPageLogic`](../../../components/CoreListingPagesLogic.tsx) panel at a time — liked vs added names/descriptions on dashboard and profile.

## Props (`ToggleOneContentPageProps`)

| Prop | Default | Purpose |
|------|---------|---------|
| `contentList` | — | Tab labels; each `value` must match a `ToggleContentTab` |
| `swrForThisUserID` | — | User id for “Added” tabs (`profileUserId` in SWR) |
| `defaultOpen` | `null` | Initial open tab |

## Tab values (`ToggleContentTab`)

`"Fav Names"` | `"Fav Descriptions"` | `"Added Names"` | `"Added Descriptions"`

## Consumers

- [`components/dashboard.jsx`](../../../components/dashboard.jsx) — all four tabs
- [`components/profile.jsx`](../../../components/profile.jsx) — Added Names / Added Descriptions only; `defaultOpen="Added Names"`
