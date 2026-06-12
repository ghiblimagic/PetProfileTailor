# EditBioAndProfile

Source: [`components/EditingData/EditBioAndProfile.tsx`](../../../components/EditingData/EditBioAndProfile.tsx)

## Role

Modal on own profile: edit location, bio, avatar via [`ImageUpload`](../../../components/AddingNewData/ImageUpload.tsx). Saves with `PUT /api/user/editbiolocationavatar`.

Exports `EditBioAndProfileProps`. Parent must pass a real `setShowProfileEditPage` boolean setter (not a toggle).

## Related

- [profile.md](profile.md)
- [user-profile-routes.md](../app/api/user-profile-routes.md)
