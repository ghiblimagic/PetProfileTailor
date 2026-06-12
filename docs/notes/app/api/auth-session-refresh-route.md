# Session refresh API

Source: [`app/api/auth/session/refresh/route.ts`](../../../../app/api/auth/session/refresh/route.ts)

`POST /api/auth/session/refresh` — reloads user fields from Mongo for `useSession().update()` after avatar change.

Exports `SessionRefreshResponse`: `id`, `name`, `profileName`, `profileImage`, `bio`, `location`.

## Related

- [image-upload.md](../../components/image-upload.md)
- [auth.md](../../lib/auth.md)
