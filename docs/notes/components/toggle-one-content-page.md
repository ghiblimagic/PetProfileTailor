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

- [`components/dashboard.tsx`](../../../components/dashboard.tsx) — all four tabs
- [`components/profile.tsx`](../../../components/profile.tsx) — Added Names / Added Descriptions only; `defaultOpen="Added Names"`
