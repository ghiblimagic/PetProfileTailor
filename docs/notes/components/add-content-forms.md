# Add content forms

Sources:

- [`components/AddingNewData/addingName.tsx`](../../../components/AddingNewData/addingName.tsx)
- [`components/AddingNewData/addingdescription.tsx`](../../../components/AddingNewData/addingdescription.tsx)

## Role

Signed-in users submit new names or descriptions with tags and optional notes. Both use [`useTags.ts`](../../../hooks/useTags.ts), [`TagsSelectAndCheatSheet.tsx`](../../../components/FormComponents/TagsSelectAndCheatSheet.tsx), [`StyledTextarea.tsx`](../../../components/FormComponents/StyledTextarea.tsx), [`preserveTextAfterSubmission.tsx`](../../../components/AddingNewData/preserveTextAfterSubmission.tsx), and [`CheckIfContentExists.tsx`](../../../components/AddingNewData/CheckIfContentExists.tsx) for duplicate checks. See [check-if-content-exists](./check-if-content-exists.md) and [form-components.md](./form-components.md).

## APIs

| Form | POST route |
|------|------------|
| Names | `/api/names` |
| Descriptions | `/api/description` |

## Pages

[`app/addnames/page.tsx`](../../../app/addnames/page.tsx), [`app/adddescriptions/page.tsx`](../../../app/adddescriptions/page.tsx), [`app/fetchname/page.tsx`](../../../app/fetchname/page.tsx) (lookup only).
