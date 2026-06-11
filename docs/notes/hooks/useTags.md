# `useTags`

Source: [`hooks/useTags.ts`](../../../hooks/useTags.ts)

## Role

Shared tag-selection state for [`TagsSelectAndCheatSheet.tsx`](../../components/FormComponents/TagsSelectAndCheatSheet.tsx) (react-select + category cheat sheet).

## Types

| Export | Shape |
|--------|-------|
| `TagOption` | `{ label, value }` — react-select option |
| `TagCheckboxChange` | `{ id, label, checked }` — cheat-sheet checkbox payload |

## API

| Return | Notes |
|--------|-------|
| `tagsToSubmit` | `TagOption[]` in user selection order |
| `tagIds` | `string[]` derived from `tagsToSubmit` |
| `handleSelectChange` | react-select multi onChange handler |
| `handleCheckboxChange` | cheat-sheet toggle handler |
| `clearTags` | resets selection |

## Consumers

`EditContent`, `AddSuggestion`, `EditSuggestion`, `TagsSelectAndCheatSheet`, `addingName.tsx`, `addingdescription.tsx`. Category options: [categories-and-tags.md](../context/categories-and-tags.md). Form notes: [add-content-forms.md](../components/add-content-forms.md).
