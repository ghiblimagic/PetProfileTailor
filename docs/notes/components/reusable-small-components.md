# Reusable small components

Source folders under [`components/Shared/`](../../../components/Shared/) — see [components/README.md](../../../components/README.md). Action buttons: [reusable-buttons.md](./reusable-buttons.md).

## `ProfileImage`

[`ProfileImage.tsx`](../../../components/Shared/media/ProfileImage.tsx) — avatar with GIF→JPG on hover; optional profile link.

## `GifHover`

[`GifHover.tsx`](../../../components/Shared/media/GifHover.tsx) — still image swaps to GIF on mouse enter. Used on landing (`not-found`), social list empty states.

```tsx
<GifHover
  gifSrc="/kittentopuppy.webp"
  stillImageSrc="/kittentopuppy.png"
  layout="responsive"
  width={300}
  height={300}
  alt="..."
/>
```

Uses legacy Next `Image` `layout` prop (same as pre-migration).

## `ListWithPawPrintIcon`

[`ListWithPawPrintIcon.tsx`](../../../components/Shared/lists/ListWithPawPrintIcon.tsx) — `<li>` with [`PawPrintIcon`](#pawprinticon) + text. Error pages, media objects.

## `ShowTime`

[`ShowTime.tsx`](../../../components/Shared/media/ShowTime.tsx) — `Intl.DateTimeFormat` with browser locale (`undefined`).

**No current imports** — author/timestamps on content rows live in [`ContentListing.tsx`](../../../components/ShowingListOfContent/ContentListing.tsx) (no date) and notification listings (inline `toLocaleString`). Revisit wiring: [`docs/FUTURE.md`](../../FUTURE.md#showtime--content-created-dates).

### Special behavior

```tsx
<span suppressHydrationWarning>
```

Server vs client timezone/locale can differ — suppresses hydration mismatch on the formatted date string.

## Headings

| Component | File | Usage |
|-----------|------|--------|
| `PageTitleWithImages` | [`PageTitleWithImages.tsx`](../../../components/Shared/typography/PageTitleWithImages.tsx) | Page hero banners |
| `WideCenteredHeading` | [`WideCenteredHeading.tsx`](../../../components/Shared/typography/WideCenteredHeading.tsx) | Landing page sections |
| `SmallCenteredHeading` | [`SmallCenteredHeading.tsx`](../../../components/Shared/typography/SmallCenteredHeading.tsx) | Settings, avatar upload (`level` = h1–h6) |

Renamed from `SmallCenteredheading.jsx` → `SmallCenteredHeading.tsx`.

## Icons / SVG

| Component | File |
|-----------|------|
| `XSvgIcon` | [`XSvgIcon.tsx`](../../../components/Shared/icons/XSvgIcon.tsx) — must sit in `relative` parent |
| `PawPrintIcon` | [`PawPrintIcon.tsx`](../../../components/Shared/icons/PawPrintIcon.tsx) |
| `NounBlackCatIcon` | [`NounBlackCatIcon.tsx`](../../../components/Shared/icons/svg/NounBlackCatIcon.tsx) — login |
| `MagicRabbitSVG` | [`MagicRabbitSVG.tsx`](../../../components/Shared/icons/svg/MagicRabbitSVG.tsx) — magic link |
| `Thanks` | [`thanks.tsx`](../../../components/Shared/icons/svg/thanks.tsx) |
| `IconWithCount` | [`IconWithCount.tsx`](../../../components/Shared/icons/IconWithCount.tsx) — notification tab badges |
