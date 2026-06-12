# Name likes [contentId] route (legacy)

Source: [`app/api/names/likes/[contentId]/route.ts`](../../../../app/api/names/likes/[contentId]/route.ts)

Misnamed path segment — **not** like toggles (those live at `.../togglelike`). GET/PUT for a single name document.

GET uses `params.contentId` (fixed from broken `params.id` in JS original).

## Related

- [togglelike-route.md](togglelike-route.md)
