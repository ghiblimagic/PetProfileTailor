# MediaObject left / right

Sources:

- [`MediaObjectLeft.tsx`](../../../components/Shared/layout/MediaObjectLeft.tsx)
- [`MediaObjectRight.tsx`](../../../components/Shared/layout/MediaObjectRight.tsx)

## Role

Reusable marketing sections on the landing page: image on one side, paw-print bullet list + `LinkButton` on the other. `MediaObjectRight` optionally shows image credit text below the image.

## Props

Both export `*Props` with shared fields: `image`, `listOfText`, `buttonText`, `buttonTextLink`, `alttext`, `imgwidth`, `imgheight`, optional `buttonStyle` (defaults to `"defaultStyle"`) — typed as `MediaObjectButtonStyle = keyof LinkButtonVariantFlags`, i.e. exactly `LinkButton`'s own flag names (`defaultStyle`, `basic`, `secondary`, `subtle`, `warning`, `active`, `disabled`), no renaming.

`buttonStyle` is passed straight through to the matching `LinkButton` flag by
[`mediaObjectLinkButtonFlags()`](../../../components/Shared/layout/mediaObjectButtonStyle.ts),
shared by both components so they can't recognize different `buttonStyle`
values from each other. Omitting `buttonStyle` falls back to `"defaultStyle"`
— there's no way to render with no button styling at all (unlike
`LinkButton` itself, which renders unstyled with no flags set). The type is
a strict union derived from `LinkButtonVariantFlags`, not a bare `string`,
so an unrecognized value is a build-time type error rather than a silent
fallback, and a flag `LinkButton` gains later is usable here immediately.

`MediaObjectRight` adds optional `credit` / `creditLink`.

## Special behavior

- `imgwidth` / `imgheight` accept string or number (landing page passes string literals); coerced with `Number()` for Next `Image`.
- Removed unused `GeneralButton` imports from the JSX originals.

## Related

- [landing-page.md](../app/landing-page.md)
- [reusable-buttons.md](reusable-buttons.md)
