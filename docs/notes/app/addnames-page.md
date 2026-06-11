# Add names page

Source: [`app/addnames/page.tsx`](../../../app/addnames/page.tsx)

## Role

Client route for `/addnames`. Shows sign-in warning when logged out; renders [`addingName.tsx`](../../../components/AddingNewData/addingName.tsx) for the full submit flow (tags, notes, duplicate check, POST `/api/names`).

## Related

- [add-content-forms.md](../components/add-content-forms.md)
- [fetchname-page.md](./fetchname-page.md) (lookup-only, no submit)
