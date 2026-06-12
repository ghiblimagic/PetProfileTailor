# Reusable button components

Source folder: [`components/ReusableSmallComponents/buttons/`](../../../components/ReusableSmallComponents/buttons/)

## `GeneralButton`

[`GeneralButton.tsx`](../../../components/ReusableSmallComponents/buttons/GeneralButton.tsx) — primary `<button>` with mutually combinable style flags (`subtle`, `warning`, `secondary`, `tertiary`, `plain`, `active`, `disabled`). Default: yellow CTA.

```tsx
<GeneralButton text="Submit" type="submit" onClick={handleSubmit} />
<GeneralButton plain text="X" type="button" onClick={onClose} />
```

`children` render beside `text` (e.g. icon-only [`GoToTopButton`](#gototopbutton)).

## `LinkButton`

[`LinkButton.tsx`](../../../components/ReusableSmallComponents/buttons/LinkButton.tsx) — `next/link` with same visual variants (`defaultStyle`, `basic`, `subtle`, `warning`, `active`, `disabled`). Optional `icon` before `text`.

## `DisabledButton`

[`DisabledButton.tsx`](../../../components/ReusableSmallComponents/buttons/DisabledButton.tsx) — always-disabled submit button for invalid admin forms.

## `ClosingXButton`

[`ClosingXButton.tsx`](../../../components/ReusableSmallComponents/buttons/ClosingXButton.tsx) — `GeneralButton` preset: `plain`, `text="X"`.

## `GoToTopButton`

[`GoToTopButton.tsx`](../../../components/ReusableSmallComponents/buttons/GoToTopButton.tsx)

### Special behavior: body scroll container

```tsx
// In this Next.js layout (h-full flex flex-col), body is the scroll container —
// window.scrollY does not update; body.scrollTop does.
const scrollContainer = document.querySelector("body");
setIsVisible(scrollContainer.scrollTop > 300);
```

Mounted in [`app/layout.tsx`](../../../app/layout.tsx) with `top="280"` scroll target.

## `GeneralOpenCloseButton`

[`GeneralOpenCloseButton.tsx`](../../../components/ReusableSmallComponents/buttons/GeneralOpenCloseButton.tsx) — generic tab toggle (`state === value` → bottom border). Used by [`ToggleOneContentPage.tsx`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx).

```tsx
<GeneralOpenCloseButton<ToggleContentTab>
  text={category.text}
  value={category.value}
  state={openContent}
  setState={handleContentClick}
/>
```

Sibling: [`iconOpenCloseButton.tsx`](../../../components/ReusableSmallComponents/buttons/iconOpenCloseButton.tsx) (notifications tabs + badge).

## `WarningMessage`

[`WarningMessage.tsx`](../../../components/ReusableSmallComponents/buttons/WarningMessage.tsx) — red banner. Optional `state` setter shows dismiss `XSvgIcon` that clears to `""`.

## `FollowButton`

[`FollowButton.tsx`](../../../components/ReusableSmallComponents/buttons/FollowButton.tsx) — follow/unfollow via hidden checkbox + `PUT /api/user/updatefollows/`. Initial state from `data.followers` array.

## Already TypeScript

| File | Role |
|------|------|
| `EditButton.tsx` | Listing row edit |
| `ShareButton.tsx` | Share popover trigger |
| `LikesButtonAndLikesLogic.tsx` | Like toggle + count |
| `ContainerForLikeShareFlag.tsx` | Action bar wrapper |
| `iconOpenCloseButton.tsx` | Notification tab buttons |

## `ReturnToPreviousPage`

[`ReturnToPreviousPage.tsx`](../../../components/ReusableSmallComponents/buttons/ReturnToPreviousPage.tsx) — `LinkButton` + `ArrowBigLeftIcon` for name/description detail pages.
