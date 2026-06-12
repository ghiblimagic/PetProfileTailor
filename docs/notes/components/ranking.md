# Ranking / points UI

Sources:

- [`PointSystemList.tsx`](../../../components/Ranking/PointSystemList.tsx)
- [`RankingTotals.tsx`](../../../components/Ranking/RankingTotals.tsx)
- [`RankNames.tsx`](../../../components/Ranking/RankNames.tsx)

## Role

Shows “treats” (names + descriptions add counts) and a fun rank title on [`dashboard.tsx`](../../../components/dashboard.tsx) and [`profile.tsx`](../../../components/profile.tsx).

`PointSystemList` renders desktop table + mobile cards, then `RankingTotals` (cookie + star icons) and `RankNames` (tier from `Math.floor(points / 10)`).

## Related

- [dashboard.md](dashboard.md)
- [profile.md](profile.md)
