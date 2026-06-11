# Fetch names page

Source: [`app/fetchnames/page.tsx`](../../../app/fetchnames/page.tsx)

## Role

Server route for `/fetchnames`. Connects to Mongo and renders [`CoreListingPageLogic`](../../../components/CoreListingPagesLogic.tsx) with `dataType="names"`.

Likes for “Fav Names” on the dashboard use [`LikesContext`](../../../context/LikesContext.tsx) via SWR — not server-prefetched on this page.

## Related

- [core-listing-pages-logic.md](../components/core-listing-pages-logic.md)
- [fetchdescriptions-page.md](./fetchdescriptions-page.md) (descriptions twin)
