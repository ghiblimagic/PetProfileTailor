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
