# Protected route group layout

Source: [`app/(protected)/layout.tsx`](../../../app/(protected)/layout.tsx)

## Role

Shared server layout for routes that require a signed-in session (dashboard, notifications, edit settings, etc.). The `(protected)` segment does not appear in URLs.

## Gate

```ts
const session = await getServerSession(serverAuthOptions);
if (!session) redirect("/login");
return <>{children}</>;
```

Unlike the admin layout, there is no role check — any authenticated user may access child routes.

## Related

- [dashboard-page.md](dashboard-page.md)
- [auth.md](../lib/auth.md)
