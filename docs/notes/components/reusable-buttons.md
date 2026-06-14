# Reusable button components

Source folder: [`components/shared/actions/`](../../../components/shared/actions/) (and [`shared/content-actions/`](../../../components/shared/content-actions/) for like/follow/share). See also [`components/README.md`](../../../components/README.md).

## `GeneralButton`

[`GeneralButton.tsx`](../../../components/shared/actions/GeneralButton.tsx) — primary `<button>` with mutually combinable style flags (`subtle`, `warning`, `secondary`, `tertiary`, `plain`, `active`, `disabled`). Default: yellow CTA.

```tsx
<GeneralButton text="Submit" type="submit" onClick={handleSubmit} />
<GeneralButton plain text="X" type="button" onClick={onClose} />
```

`children` render beside `text` (e.g. icon-only [`GoToTopButton`](#gototopbutton)).

## `LinkButton`

[`LinkButton.tsx`](../../../components/shared/actions/LinkButton.tsx) — `next/link` with same visual variants (`defaultStyle`, `basic`, `subtle`, `warning`, `active`, `disabled`). Optional `icon` before `text`.

## `DisabledButton`

[`DisabledButton.tsx`](../../../components/shared/actions/DisabledButton.tsx) — always-disabled submit button for invalid admin forms.

## `ClosingXButton`

[`ClosingXButton.tsx`](../../../components/shared/actions/ClosingXButton.tsx) — `GeneralButton` preset: `plain`, `text="X"`.

## `GoToTopButton`

[`GoToTopButton.tsx`](../../../components/shared/actions/GoToTopButton.tsx)

### Special behavior: body scroll container

```tsx
// In this Next.js layout (h-full flex flex-col), body is the scroll container —
// window.scrollY does not update; body.scrollTop does.
const scrollContainer = document.querySelector("body");
setIsVisible(scrollContainer.scrollTop > 300);
```

Mounted in [`app/layout.tsx`](../../../app/layout.tsx) with `top="280"` scroll target.

## `GeneralOpenCloseButton`

[`GeneralOpenCloseButton.tsx`](../../../components/shared/actions/GeneralOpenCloseButton.tsx) — generic tab toggle (`state === value` → bottom border). Used by [`ToggleOneContentPage.tsx`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx).

```tsx
<GeneralOpenCloseButton<ToggleContentTab>
  text={category.text}
  value={category.value}
  state={openContent}
  setState={handleContentClick}
/>
```

Sibling: [`iconOpenCloseButton.tsx`](../../../components/shared/actions/iconOpenCloseButton.tsx) (notifications tabs + badge).

## `WarningMessage`

[`WarningMessage.tsx`](../../../components/shared/feedback/WarningMessage.tsx) — red banner. Optional `state` setter shows dismiss `XSvgIcon` that clears to `""`.

## `FollowButton`

[`FollowButton.tsx`](../../../components/shared/content-actions/FollowButton.tsx) — follow/unfollow via hidden checkbox + `PUT /api/user/updatefollows/`. Initial state from `data.followers` array.

## Already TypeScript

| File | Role |
|------|------|
| `EditButton.tsx` | Listing row edit |
| `ShareButton.tsx` | Share popover trigger |
| `LikesButtonAndLikesLogic.tsx` | Like toggle + count |
| `ContainerForLikeShareFlag.tsx` | Action bar wrapper |
| `iconOpenCloseButton.tsx` | Notification tab buttons |

## `ReturnToPreviousPage`

[`ReturnToPreviousPage.tsx`](../../../components/shared/actions/ReturnToPreviousPage.tsx) — `LinkButton` + `ArrowBigLeftIcon` for name/description detail pages.
