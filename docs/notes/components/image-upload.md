# ImageUpload

Source: [`components/AddingNewData/ImageUpload.tsx`](../../../components/AddingNewData/ImageUpload.tsx)

Client avatar flow:

1. Pick file → preview
2. POST to Cloudinary (`upload_preset: noyhrbxs`)
3. `PUT /api/user/uploadprofileimage` with `secure_url`
4. `POST /api/auth/session/refresh` → `useSession().update()` for navbar avatar

Optional props: `setAvatar`, `setShowDialog` (used from bio edit modal).

Exports `ImageUploadProps`.

## Related

- [user-profile-routes.md](../app/api/user-profile-routes.md)
- [editsettings-page.md](../app/editsettings-page.md)
