# Profile page

Source: [`app/profile/[profilename]/page.tsx`](../../../app/profile/[profilename]/page.tsx)

## Role

Server route for `/profile/[profilename]`. Loads user by lowercase `profileName`, follower list, and created names/descriptions for [`profile.tsx`](../../../components/profile.tsx).

## Data loaded

| Query | Passed to client |
|-------|------------------|
| `User.findOne({ profileName })` | `userData` (+ `followers` from `getUserFollowers`) |
| `Names.find({ createdBy })` | `nameList` (add count; tabs use SWR) |
| `Description.find({ createdBy })` | `createdDescriptions` |

Listing tabs use `ToggleOneContentPage` → SWR, not these arrays directly (except `.length` on points card).

## Related

- [profile.md](../components/profile.md)
- [toggle-one-content-page.md](../components/toggle-one-content-page.md)
