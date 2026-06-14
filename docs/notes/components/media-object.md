# MediaObject left / right

Sources:

- [`MediaObjectLeft.tsx`](../../../components/Shared/layout/MediaObjectLeft.tsx)
- [`MediaObjectRight.tsx`](../../../components/Shared/layout/MediaObjectRight.tsx)

## Role

Reusable marketing sections on the landing page: image on one side, paw-print bullet list + `LinkButton` on the other. `MediaObjectRight` optionally shows image credit text below the image.

## Props

Both export `*Props` with shared fields: `image`, `listOfText`, `buttonText`, `buttonTextLink`, `alttext`, `imgwidth`, `imgheight`, optional `buttonStyle` (`"subtle"` uses subtle `LinkButton` styling).

`MediaObjectRight` adds optional `credit` / `creditLink`.

## Special behavior

- `imgwidth` / `imgheight` accept string or number (landing page passes string literals); coerced with `Number()` for Next `Image`.
- Removed unused `GeneralButton` imports from the JSX originals.

## Related

- [landing-page.md](../app/landing-page.md)
- [reusable-buttons.md](reusable-buttons.md)
