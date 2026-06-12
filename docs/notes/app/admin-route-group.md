# Admin route group

Sources:

- [`app/(admin)/layout.tsx`](../../../app/(admin)/layout.tsx)
- [`app/(admin)/addnamecategory/page.tsx`](../../../app/(admin)/addnamecategory/page.tsx)
- [`app/(admin)/adddescriptioncategory/page.tsx`](../../../app/(admin)/adddescriptioncategory/page.tsx)
- [`app/(admin)/addnametag/page.tsx`](../../../app/(admin)/addnametag/page.tsx)
- [`app/(admin)/adddescriptiontag/page.tsx`](../../../app/(admin)/adddescriptiontag/page.tsx)

## Role

Route group for admin-only CRUD on categories and tags. URLs are flat (no `/admin` prefix) because the folder name `(admin)` is a Next.js route group.

## Server gate (`layout.tsx`)

```ts
const session = await getServerSession(serverAuthOptions);
if (!session) redirect("/login");

const isAdmin = role === "admin" && status === "active";
if (!isAdmin) redirect("/dashboard");

return <AdminWrapper isAdmin={isAdmin}>{children}</AdminWrapper>;
```

Non-admins never reach child pages. Signed-out users go to `/login`.

## Client pages

All four pages are `"use client"` forms that:

1. Read `isAdmin` from [`AdminContext`](../../context/admin-context.md) (belt-and-suspenders with layout gate).
2. Use [`useCategoriesForDataType`](../../hooks/useTags.md) for category/tag pickers.
3. POST new tag/category to the matching API route, then PUT to attach tags to categories where needed.

| Route | API |
|-------|-----|
| `/addnamecategory` | `POST /api/namecategories` |
| `/adddescriptioncategory` | `POST /api/descriptioncategory` |
| `/addnametag` | `POST /api/nametag` → `PUT /api/namecategories/edittags` |
| `/adddescriptiontag` | `POST /api/descriptiontag` → `PUT /api/descriptioncategory/edittags` |

## Special behavior

- `addnametag` / `adddescriptiontag` use `CategoryWithTags[]` for multi-select via `StyledSelect`.
- Invalid `className` on `StyledSelect` was removed in `adddescriptiontag` (prop not supported).

## Related

- [admin-context.md](../context/admin-context.md)
- [categories-and-tags.md](../context/categories-and-tags.md)
- [form-components.md](../components/form-components.md)
