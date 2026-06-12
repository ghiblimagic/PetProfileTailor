# Edit settings page

Source: [`app/(protected)/editsettings/page.tsx`](../../../app/(protected)/editsettings/page.tsx)

## Role

Protected `/editsettings` route. Profile form (name, email, password) plus [`ImageUpload`](../../../components/AddingNewData/ImageUpload) for avatar.

## Auth

- Parent [`(protected)/layout.tsx`](../../../app/(protected)/layout.tsx) redirects unsigned users.
- Page also redirects on `status === "unauthenticated"` and shows `LoadingSpinner` while session loads.
- Removed legacy `ProfileScreen.auth = true` (Pages Router pattern; unused in App Router).

## Form

`EditSettingsFormValues` typed for `react-hook-form`. Submits `PUT /api/auth/update` with `name`, `email`, `password`, `userid`.

Session seeds `name` and `userid` via `setValue` when `session` is available.

## Related

- [protected-layout.md](protected-layout.md)
- [form-components.md](../components/form-components.md)
