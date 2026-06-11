# Add content forms

Sources:

- [`components/AddingNewData/addingName.tsx`](../../../components/AddingNewData/addingName.tsx)
- [`components/AddingNewData/addingdescription.tsx`](../../../components/AddingNewData/addingdescription.tsx)

## Role

Signed-in users submit new names or descriptions with tags and optional notes. Both use [`useTags.ts`](../../../hooks/useTags.ts), [`TagsSelectAndCheatSheet.tsx`](../../FormComponents/TagsSelectAndCheatSheet.tsx), and [`CheckIfContentExists.tsx`](../../../components/AddingNewData/CheckIfContentExists.tsx) for duplicate checks. See [check-if-content-exists](./check-if-content-exists.md).

## APIs

| Form | POST route |
|------|------------|
| Names | `/api/names` |
| Descriptions | `/api/description` |

## Pages

`app/addnames/page.js`, `app/adddescriptions/page.js`, `app/fetchname/page.js`.
