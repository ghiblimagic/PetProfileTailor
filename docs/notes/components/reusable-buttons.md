# Reusable button components

Source folder: [`components/Shared/actions/`](../../../components/Shared/actions/) (and [`shared/content-actions/`](../../../components/Shared/content-actions/) for like/follow/share). See also [`components/README.md`](../../../components/README.md).

## Shared styling: `buttonStyles.ts`

[`buttonStyles.ts`](../../../components/Shared/actions/buttonStyles.ts) is
the single source of truth for both `GeneralButton` and `LinkButton` —
base classes, the `BUTTON_VARIANT_CLASSES` color/class map, and a
`resolve*Variant()` helper per component that reproduces each component's
own flag-precedence order (flags are checked in sequence; a later true flag
overrides an earlier one). Add or recolor a variant here once and both
components pick it up.

Colors are drawn from the design-system tokens in `tailwind.config.js`
(`primary`, `secondary`, `subtleBackground`, `subtleBorder`, `subtleWhite`)
plus a small accent/outline/disabled set added alongside them
(`buttonAccent`, `accentFill`, `accentFillBorder`, `outlineBorder`,
`warningHover`, `disabledBg`, `disabledText`) — no more ad-hoc Tailwind
yellow/blue/gray. Named `buttonAccent` rather than `accent` — tailwind.config.js
already has an unrelated, otherwise-unused shadcn `accent: { DEFAULT:
"hsl(var(--accent))", ... }` token (a near-white gray), and a same-named key
added later in the same object silently wins, which is exactly what
happened the first time this was added — hover/active states rendered as
grey/white instead of blue until the rename.
All text/background pairs meet WCAG AA (4.5:1); outline-only borders
(`secondary`, `tertiary`, `disabled`) meet 3:1. Previously most `GeneralButton`
variants set a border _color_ without a border _width_ utility, so the
border was invisible in practice — every variant now sets an explicit width.

Both components compose `className`s with `cn()` ([`lib/utils.ts`](../../../lib/utils.ts),
clsx + tailwind-merge) instead of raw string concatenation, so a variant's
classes and any caller-supplied `className` resolve conflicts predictably
(last one wins) rather than depending on Tailwind's generated-CSS source
order.

## `GeneralButton`

[`GeneralButton.tsx`](../../../components/Shared/actions/GeneralButton.tsx) — primary `<button>` with mutually combinable style flags (`subtle`, `warning`, `secondary`, `tertiary`, `plain`, `active`, `disabled`). Default: `subtleBackground` CTA.

```tsx
<GeneralButton text="Submit" type="submit" onClick={handleSubmit} />
<GeneralButton plain text="X" type="button" onClick={onClose} />
```

`heroStyle` is a separate, standalone flag (dark navy pill button used over
the landing-page hero image, e.g. [`HeroTop.tsx`](../../../components/LandingPage/HeroTop.tsx)) — it's a full visual reset, not designed to combine with the other flags above.

`children` render beside `text` (e.g. icon-only [`GoToTopButton`](#gototopbutton)).

## `LinkButton`

[`LinkButton.tsx`](../../../components/Shared/actions/LinkButton.tsx) — `next/link` styled via the same shared [`buttonStyles.ts`](../../../components/Shared/actions/buttonStyles.ts) map as `GeneralButton`. Variant flags: `defaultStyle` (→ the same CTA look as `GeneralButton`'s default), `basic` (underline nav-link look, no fill), `secondary`, `subtle`, `warning`, `active`, `disabled`. Optional `icon` before `text`.

Flag names don't fully match `GeneralButton`'s (no `tertiary`/`plain`
equivalents; `basic`/`defaultStyle` have no `GeneralButton` counterpart) — call
sites keep their existing prop names, only the underlying colors are shared.
`secondary` was added on top of the original set (see
[media-object.md](media-object.md)) once a call site needed it — add further
flags the same way: a case in `resolveLinkButtonVariant()`
([buttonStyles.ts](../../../components/Shared/actions/buttonStyles.ts)) mapped
onto an existing `BUTTON_VARIANT_CLASSES` entry, no new colors needed.
**No flag set → no variant classes at all** (unlike `GeneralButton`, which
always applies its default look) — several call sites
(`NavLayoutwithSettingsMenu.tsx`'s logo link, `SharingOptionsBar.tsx`,
`ReturnToPreviousPage.tsx`) rely on rendering fully unstyled and driven only
by their own `className`.

## `DisabledButton`

[`DisabledButton.tsx`](../../../components/Shared/actions/DisabledButton.tsx) — always-disabled submit button for invalid admin forms.

## `ClosingXButton`

[`ClosingXButton.tsx`](../../../components/Shared/actions/ClosingXButton.tsx) — `GeneralButton` preset: `plain`, `text="X"`.

## `GoToTopButton`

[`GoToTopButton.tsx`](../../../components/Shared/actions/GoToTopButton.tsx)

### Special behavior: body scroll container

```tsx
// In this Next.js layout (h-full flex flex-col), body is the scroll container —
// window.scrollY does not update; body.scrollTop does.
const scrollContainer = document.querySelector("body");
setIsVisible(scrollContainer.scrollTop > 300);
```

Mounted in [`app/layout.tsx`](../../../app/layout.tsx) with `top="280"` scroll target.

## `GeneralOpenCloseButton`

[`GeneralOpenCloseButton.tsx`](../../../components/Shared/actions/GeneralOpenCloseButton.tsx) — generic tab toggle (`state === value` → bottom border). Used by [`ToggleOneContentPage.tsx`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx).

```tsx
<GeneralOpenCloseButton<ToggleContentTab>
  text={category.text}
  value={category.value}
  state={openContent}
  setState={handleContentClick}
/>
```

Sibling: [`iconOpenCloseButton.tsx`](../../../components/Shared/actions/iconOpenCloseButton.tsx) (notifications tabs + badge).

## `WarningMessage`

[`WarningMessage.tsx`](../../../components/Shared/feedback/WarningMessage.tsx) — red banner. Optional `state` setter shows dismiss `XSvgIcon` that clears to `""`.

## `FollowButton`

[`FollowButton.tsx`](../../../components/Shared/content-actions/FollowButton.tsx) — follow/unfollow via hidden checkbox + `PUT /api/user/updatefollows/`. Initial state from `data.followers` array.

## Already TypeScript

| File                            | Role                     |
| ------------------------------- | ------------------------ |
| `EditButton.tsx`                | Listing row edit         |
| `ShareButton.tsx`               | Share popover trigger    |
| `LikesButtonAndLikesLogic.tsx`  | Like toggle + count      |
| `ContainerForLikeShareFlag.tsx` | Action bar wrapper       |
| `iconOpenCloseButton.tsx`       | Notification tab buttons |

## `ReturnToPreviousPage`

[`ReturnToPreviousPage.tsx`](../../../components/Shared/actions/ReturnToPreviousPage.tsx) — `LinkButton` + `ArrowBigLeftIcon` for name/description detail pages.
