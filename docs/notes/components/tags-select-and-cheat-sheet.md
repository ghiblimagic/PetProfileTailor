# `TagsSelectAndCheatSheet`

Source: [`components/FormComponents/TagsSelectAndCheatSheet.tsx`](../../../components/FormComponents/TagsSelectAndCheatSheet.tsx)

## Role

Multi-select tag picker (react-select) plus optional category cheat-sheet checkboxes. Categories come from [`useCategoriesForDataType.ts`](../../../hooks/useCategoriesForDataType.ts) / [`CategoriesAndTagsContext.tsx`](../../../context/CategoriesAndTagsContext.tsx). Notes: [categories-and-tags.md](../context/categories-and-tags.md).

## Props

Wired from [`useTags.ts`](../../../hooks/useTags.ts): `tagsToSubmit`, `handleSelectChange`, `handleCheckboxChange`.

| Prop | Notes |
|------|-------|
| `dataType` | `"names"` or `"descriptions"` |
| `isDisabled` | disables select + cheat sheet when unsigned in |

## Selected-tag chips: `TagPillMultiValue`

The react-select field's selected-tag chips render via a `TagPillMultiValue`
component (defined in this file) passed as `components={{ MultiValue:
TagPillMultiValue }}` on `<Select>` — this makes them look like the same
`"#tag"` pill used everywhere else tags are shown
([`TagPill`](./form-components.md#tagpill): `ContentListing.tsx`,
`addingdescription.tsx`), rather than react-select's own default chip
styling. It replaces react-select's `MultiValue` **entirely** (not just its
`Container`/`Label` sub-parts), so react-select's own CSS-in-JS styling for
those parts never runs — that's why `customSelectStyles` here has no
`multiValue`/`multiValueLabel`/`multiValueRemove` entries.

`removeProps` (from react-select) is typed as `<div>` props since
react-select's own default `Remove` sub-component renders a div, but at
runtime it's just `{ onClick, onTouchEnd, onMouseDown }` — safe to spread
onto a `<button>` with a type cast rather than switching to a `<div
role="button">`.

**Don't destructure `innerProps` here.** `MultiValueProps['innerProps']` is
typed as required, but react-select's `Select.js`
(`renderPlaceholderOrValue`) only passes `data`/`removeProps`/`isDisabled`/
`isFocused`/`components`/`selectProps` to the top-level `MultiValue`
element — `innerProps` is something react-select's own *default*
`MultiValue` implementation computes internally for its `Container`
sub-component, which `TagPillMultiValue` replaces entirely. It's genuinely
`undefined` here despite the type; reading it crashed with "Cannot
destructure property 'ref' of 'innerProps' as it is undefined" the moment
any tag was selected. `TagsSelectAndCheatSheet.test.tsx` guards this.

## Cheat-sheet checkboxes: `StyledCheckbox`, not inline markup

The per-tag checkboxes in the cheat-sheet panel render
[`StyledCheckbox`](./form-components.md#styledcheckbox) — they used to be a
hand-rolled copy of the same markup, which had already drifted (this file
had the "paw icon only shows when checked" behavior before it was
backported to `StyledCheckbox` itself). Reuses `StyledCheckbox`'s two
styling-escape-hatch props to keep the cheat sheet's row-hover-highlight
look:

```tsx
<StyledCheckbox
  value={tag._id}
  label={tag.tag}
  labelClassName="text-left" // cheat-sheet tags aren't bold, unlike other consumers' default
  checked={checked}
  disabled={isDisabled}
  onChange={(e) => handleCheckboxChange({ id: tag._id, label: tag.tag, checked: e.target.checked })}
  className="group hover:bg-blue-700 px-1 py-1 rounded" // outer <label>
  boxClassName={`group-hover:bg-blue-700 ${isDisabled ? "bg-errorBackgroundColor" : ""}`} // icon box
/>
```
