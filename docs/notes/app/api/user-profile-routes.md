# User profile API routes

| Route | Methods | Notes |
|-------|---------|-------|
| `/api/user/[id]` | GET, PUT | Uses **session user id**; URL `[id]` ignored |
| `/api/user/getASpecificUser/[id]` | GET | Public profile by Mongo id |
| `/api/user/getASpecificUserByProfileName/[name]` | GET | Profile + `getUserFollowers` |
| `/api/user/getASpecificUsersFollowers/[name]` | GET | Queries `{ name }` field (not `profileName`) |
| `/api/user/uploadprofileimage` | PUT | Cloudinary URL + delete old asset |
| `/api/user/editbiolocationavatar` | PUT | `{ bioSubmission: { bio, location } }` |

## Related

- [editsettings-page.md](../editsettings-page.md)
- [image-upload.md](../../components/image-upload.md)
