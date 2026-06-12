# NavBar

Primary header mounted in [`app/layout.tsx`](../../../app/layout.tsx) via [`NavLayoutwithSettingsMenu.tsx`](../../../components/NavBar/NavLayoutwithSettingsMenu.tsx).

## `NavLayoutwithSettingsMenu`

- **Mobile:** [`MobileNavBar.tsx`](../../../components/NavBar/NavBarPieces/MobileNavBar/MobileNavBar.tsx) (hamburger, `lg:hidden`)
- **Desktop links:** [`NavBarNames.tsx`](../../../components/NavBar/NavBarPieces/DesktopNavBar/NavBarNames.tsx) (`hidden lg:flex`)
- **Logo:** `LinkButton` → `/` (desktop only; mobile uses menu Home link)
- **Signed in:** `NotificationsButton`, profile `Menu` (dashboard, profile, settings, contact, logout)
- **Signed out:** login / register `LinkButton`s (not full auth forms — those live on `/login`, `/register`)

### Special behavior: invalid session cleanup

```tsx
useEffect(() => {
  if (status === "authenticated" && !session?.user) {
    signOut(); // ensures cookies cleared if token nuked, aka for a banner user
  }
}, [session, status]);
```

## `NavBarLink`

[`NavBarLink.tsx`](../../../components/NavBar/NavBarPieces/NavBarLink.tsx)

Uses `usePathname()` (App Router) for active detection. On current page, `href` becomes `#main` for skip-link-style behavior.

```tsx
//https://prismic.io/blog/nextjs-accessibility
{isActive && <span className="visually-hidden">Current page: </span>}
<Link href={linkHref} aria-current={isActive ? "page" : undefined} />
```

**Note:** Migrated from `router.pathname` (Pages Router) — was ineffective under App Router.

## Desktop dropdowns

| Component | Links |
|-----------|--------|
| [`FetchDropDownMenu.tsx`](../../../components/NavBar/NavBarPieces/DesktopNavBar/FetchDropDownMenu.tsx) | `/fetchnames`, `/fetchname`, `/fetchdescriptions` |
| [`AddItemsDropDownMenu.tsx`](../../../components/NavBar/NavBarPieces/DesktopNavBar/AddItemsDropDownMenu.tsx) | `/addnames`, `/adddescriptions` |
| [`AdminDropdownMenu.tsx`](../../../components/NavBar/NavBarPieces/DesktopNavBar/AdminDropdownMenu.tsx) | Admin CRUD routes — see [admin-context.md](../context/admin-context.md) |

### Headless UI + Next `Link`

> You cannot just use MenuItem as={Link}, because Link is a React component, not a DOM element. Headless UI needs a real DOM element for ref.

Pattern: `MenuItem` render prop → `<Link>` child.

## `MobileNavBar`

Section headers (`Fetch/Find`, `Add`) are disabled `MenuItem` + `<button disabled>` for visual grouping. Admin links are desktop-only today.
