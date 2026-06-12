# Footer

Sources:

- [`Footer.tsx`](../../../components/footer/Footer.tsx)
- [`FooterLink.tsx`](../../../components/footer/FooterLink.tsx)

## Role

Site-wide footer in root layout: logo, Find/Add/Reach Out link columns, icon credits, copyright.

## FooterLink

Client component mirroring [`NavBarLink`](../components/navbar.md) a11y pattern:

- Uses `usePathname()` (not `router.pathname`, which is Pages Router).
- Active route links to `#main` instead of reloading the same page.
- `aria-current="page"` when active.

## Special behavior

- Invalid `<h7>` tags from the JSX original replaced with `<h6>` (HTML has no `h7`).

## Related

- [root-layout.md](../app/root-layout.md)
