# Admin context and nav

## `AdminContext` / `AdminProvider`

Source: [`context/AdminContext.tsx`](../../../context/AdminContext.tsx)

Gates `(admin)` routes and exposes `isAdmin` to client pages.

```tsx
export type AdminContextValue = { isAdmin: boolean };

export function useAdmin(): AdminContextValue;
```

### Server layout → client provider

[`app/(admin)/layout.jsx`](../../../app/(admin)/layout.jsx):

```jsx
const isAdmin = role === "admin" && status === "active";
if (!isAdmin) redirect("/dashboard");
return <AdminWrapper isAdmin={isAdmin}>{children}</AdminWrapper>;
```

[`AdminWrapper.tsx`](../../../wrappers/AdminWrapper.tsx) passes `isAdminServer={isAdmin}` into `AdminProvider`.

### Special behavior

Client `useEffect` re-checks session; non-admin authenticated users are pushed to `/dashboard`:

```tsx
if (status === "authenticated" && !nextIsAdmin) {
  router.push("/dashboard");
}
```

`isAdmin` state updates only when `nextIsAdmin !== isAdmin` to avoid extra renders.

### Consumers

- `app/(admin)/addnamecategory`, `addnametag`, `adddescriptioncategory`, `adddescriptiontag` — `useAdmin()` (often with redundant server redirect already in layout)

## `AdminDropdownMenu`

Source: [`components/NavBar/NavBarPieces/DesktopNavBar/AdminDropdownMenu.tsx`](../../../components/NavBar/NavBarPieces/DesktopNavBar/AdminDropdownMenu.tsx)

Shown in [`NavBarNames.jsx`](../../../components/NavBar/NavBarPieces/DesktopNavBar/NavBarNames.jsx) when `role === "admin" && status === "active"`.

Links: `/adddescriptioncategory`, `/adddescriptiontag`, `/addnamecategory`, `/addnametag`.

### Headless UI + Next `Link`

> You cannot just use MenuItem as={Link}, because Link is a React component, not a DOM element. Headless UI needs a real DOM element for ref.

Render pattern: `MenuItem` → render prop → `<Link>` child.

Description body on listings is rendered inline in [`ContentListing.tsx`](../../../components/ShowingListOfContent/ContentListing.tsx) (deleted unused `ParagraphRenderBasedOnStringProperty`).
