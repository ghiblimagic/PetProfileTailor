# Reusable button components

Source folder: [`components/Shared/actions/`](../../../components/Shared/actions/) (and [`shared/content-actions/`](../../../components/Shared/content-actions/) for like/follow/share). See also [`components/README.md`](../../../components/README.md).

## `GeneralButton`

[`GeneralButton.tsx`](../../../components/Shared/actions/GeneralButton.tsx) — primary `<button>` with mutually combinable style flags (`subtle`, `warning`, `secondary`, `tertiary`, `plain`, `active`, `disabled`). Default: yellow CTA.

```tsx
<GeneralButton text="Submit" type="submit" onClick={handleSubmit} />
<GeneralButton plain text="X" type="button" onClick={onClose} />
```

`children` render beside `text` (e.g. icon-only [`GoToTopButton`](#gototopbutton)).

## `LinkButton`

[`LinkButton.tsx`](../../../components/Shared/actions/LinkButton.tsx) — `next/link` with same visual variants (`defaultStyle`, `basic`, `subtle`, `warning`, `active`, `disabled`). Optional `icon` before `text`.

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

| File | Role |
|------|------|
| `EditButton.tsx` | Listing row edit |
| `ShareButton.tsx` | Share popover trigger |
| `LikesButtonAndLikesLogic.tsx` | Like toggle + count |
| `ContainerForLikeShareFlag.tsx` | Action bar wrapper |
| `iconOpenCloseButton.tsx` | Notification tab buttons |

## `ReturnToPreviousPage`

[`ReturnToPreviousPage.tsx`](../../../components/Shared/actions/ReturnToPreviousPage.tsx) — `LinkButton` + `ArrowBigLeftIcon` for name/description detail pages.
