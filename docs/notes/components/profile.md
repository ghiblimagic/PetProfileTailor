# `Profile`

Source: [`components/profile.tsx`](../../../components/profile.tsx)

## Role

Public profile view: avatar/bio card, add counts, [`ToggleOneContentPage`](../../../components/ShowingListOfContent/ToggleOneContentPage.tsx) for user's added names/descriptions, and optional [`EditBioAndProfile`](../../../components/EditingData/EditBioAndProfile.jsx) when viewing own profile.

## Props (`ProfileProps`)

| Prop | Purpose |
|------|---------|
| `userData` | `ProfileUserData` — `_id`, `name`, `profileName`, `profileImage`, `bio`, `location`, optional `followers` |
| `nameList` | User's created names (`.length` for points; listing via SWR tabs) |
| `createdDescriptions` | User's created descriptions |

## Page

See [profile-page.md](../app/profile-page.md).

## Related

- [toggle-one-content-page.md](./toggle-one-content-page.md)
