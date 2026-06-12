# Landing page

Sources:

- [`app/page.tsx`](../../../app/page.tsx)
- [`components/LandingPage/HeroTop.tsx`](../../../components/LandingPage/HeroTop.tsx)

## Role

Public home route `/`. Client component that composes the hero, optional YouTube embeds, and `MediaObjectLeft` / `MediaObjectRight` marketing sections.

## Video toggles

`LandingVideoKey` union (`"impactful" | "fun" | "tailor"`) drives which `YoutubeEmbed` is open. `HeroTop` passes three callbacks; the page toggles one key at a time (click again to close).

```ts
const [openVideo, setOpenVideo] = useState<LandingVideoKey | null>(null);

function handleVideoClick(videoKey: LandingVideoKey) {
  setOpenVideo(openVideo === videoKey ? null : videoKey);
}
```

## HeroTop

- Exports `HeroTopProps` for the three video callbacks.
- Uses `usePrefersReducedMotion` to show a still pug image instead of animated WebP when the user prefers reduced motion or on hover.

## Related

- [media-object.md](../components/media-object.md)
- [root-layout.md](root-layout.md)
- [youtube-and-social-lists.md](../components/showing-list-of-content/youtube-and-social-lists.md)
