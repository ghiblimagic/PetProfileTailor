# Category and tag API routes

Admin-managed taxonomy for names and descriptions.

| Route | Methods | Auth |
|-------|---------|------|
| `/api/namecategories` | GET, POST | POST: admin |
| `/api/descriptioncategory` | GET, POST | POST: admin |
| `/api/nametag` | GET, POST | POST: admin |
| `/api/descriptiontag` | GET, POST | POST: admin |
| `/api/namecategories/edittags` | PUT | admin |
| `/api/descriptioncategory/edittags` | PUT | admin |

POST creates with `createdBy: session.user.id`. Edittags routes `$push` a tag id onto selected category ids.

## Related

- [admin-route-group.md](../admin-route-group.md)
- [categories-and-tags-route.md](categories-and-tags-route.md)
