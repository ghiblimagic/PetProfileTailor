# Dashboard page

Source: [`app/(protected)/dashboard/page.tsx`](../../../app/(protected)/dashboard/page.tsx)

## Role

Server route for `/dashboard`. Requires session (redirects to `/login`). Loads the signed-in user's created names and descriptions from Mongo for add-count display on [`dashboard.tsx`](../../../components/dashboard.tsx).

## Data loaded

| Query | Passed to client as |
|-------|---------------------|
| `Names.find({ createdBy: userId })` + populate | `namesCreated` |
| `Description.find({ createdBy: userId })` + populate | `createdDescriptions` |

Only `.length` is used on the client (points table). Listing tabs use SWR + `LikesContext`, not these arrays.

## Related

- [dashboard.md](../components/dashboard.md)
- [toggle-one-content-page.md](../components/toggle-one-content-page.md)
