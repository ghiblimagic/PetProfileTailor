# Components layout

## Where to put new code

| You need… | Put it in… |
|-----------|------------|
| Generic styled button or link (no domain API logic) | [`shared/actions/`](shared/actions/) |
| Alert, warning, dismissible message | [`shared/feedback/`](shared/feedback/) |
| Icon or SVG asset | [`shared/icons/`](shared/icons/) |
| Page title or section heading | [`shared/typography/`](shared/typography/) |
| Avatar or image hover trick | [`shared/media/`](shared/media/) |
| Timestamp display | [`shared/media/`](shared/media/) |
| Bulleted list row with paw icon | [`shared/lists/`](shared/lists/) |
| Landing image + bullet block | [`shared/layout/`](shared/layout/) |
| Like, follow, share on content | [`shared/content-actions/`](shared/content-actions/) |
| Loading spinner, skeleton | [`shared/ui/`](shared/ui/) |
| Tied to one page, route, or feature | Feature folder (`Notifications/`, `Thanks/`, `FormComponents/`, …) |

**Rule:** If it is generic and used in two or more features → `shared/{category}`. If it is tied to one feature → that feature folder.

## `shared/` categories

```
shared/
├── actions/          # click targets with little or no domain logic
├── feedback/         # messages, alerts, dismissible banners
├── icons/            # PawPrintIcon, XSvgIcon, svg assets, IconBadge
├── typography/       # PageTitleWithImages, section headings
├── media/            # ProfileImage, GifHover, ShowTime
├── lists/            # ListWithPawPrintIcon
├── layout/           # MediaObjectLeft, MediaObjectRight
├── content-actions/  # Follow, like, share, SharingOptionsBar
└── ui/               # LoadingSpinner, skeleton
```

## Legacy folders (removed)

`ReusableSmallComponents/` and `ReusableMediumComponents/` were reorganized into `shared/` by **job**, not file size. Notes still live under [`docs/notes/components/`](../docs/notes/components/) — see [`reusable-buttons.md`](../docs/notes/components/reusable-buttons.md) and [`reusable-small-components.md`](../docs/notes/components/reusable-small-components.md) (paths updated there).
