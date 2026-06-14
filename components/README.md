# Components layout

## Folder naming

Top-level folders under `components/` use **PascalCase** (`Footer/`, `Shared/`, `Notifications/`). Category subfolders inside `Shared/` stay **lowercase** (`actions/`, `feedback/`, `ui/`).

## Where to put new code

| You need… | Put it in… |
|-----------|------------|
| Generic styled button or link (no domain API logic) | [`Shared/actions/`](Shared/actions/) |
| Alert, warning, dismissible message | [`Shared/feedback/`](Shared/feedback/) |
| Icon or SVG asset | [`Shared/icons/`](Shared/icons/) |
| Page title or section heading | [`Shared/typography/`](Shared/typography/) |
| Avatar or image hover trick | [`Shared/media/`](Shared/media/) |
| Timestamp display | [`Shared/media/`](Shared/media/) |
| Bulleted list row with paw icon | [`Shared/lists/`](Shared/lists/) |
| Landing image + bullet block | [`Shared/layout/`](Shared/layout/) |
| Like, follow, share on content | [`Shared/content-actions/`](Shared/content-actions/) |
| Loading spinner, skeleton | [`Shared/ui/`](Shared/ui/) |
| Site footer chrome | [`Footer/`](Footer/) |
| Tied to one page, route, or feature | Feature folder (`Notifications/`, `Thanks/`, `FormComponents/`, …) |

**Rule:** If it is generic and used in two or more features → `Shared/{category}`. If it is tied to one feature → that feature folder.

## `Shared/` categories

```
Shared/
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

`ReusableSmallComponents/` and `ReusableMediumComponents/` were reorganized into `Shared/` by **job**, not file size. Notes still live under [`docs/notes/components/`](../docs/notes/components/) — see [`reusable-buttons.md`](../docs/notes/components/reusable-buttons.md) and [`reusable-small-components.md`](../docs/notes/components/reusable-small-components.md) (paths updated there).
