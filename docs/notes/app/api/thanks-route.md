# Thanks API routes

- [`app/api/thanks/route.ts`](../../../app/api/thanks/route.ts) — POST create, GET fetch user's thanks for content
- [`app/api/thanks/get-thanks-count/route.ts`](../../../app/api/thanks/get-thanks-count/route.ts) — unread count for content creator

## POST `/api/thanks`

Body: `{ contentType, contentId, contentCreator, messages }`.

- Max 10 thanks per user per content item.
- Cannot thank own content.
- `messages` tags must match [`data/ThanksOptions.ts`](../../../data/ThanksOptions.ts) (enforced on `Thank` schema).

### `contentType` for descriptions

Canonical value is `"descriptions"` (paired with `"names"`). POST sets `descriptionId` via `isDescriptionsContentType()` in [`checkIfValidContentType.ts`](../../../utils/api/checkIfValidContentType.ts), which also accepts legacy `"description"` when reading old records.

## UI flow

[`ThanksButton.tsx`](../../../components/Thanks/ThanksButton.tsx) → [`useThanksHandler.ts`](../../../hooks/useThanksHandler.ts) → [`ThanksDialog.tsx`](../../../components/Thanks/ThanksDialog.tsx) → [`AddThanks.tsx`](../../../components/Thanks/AddThanks.tsx).

### Tests

| Layer | File | What it covers |
|-------|------|----------------|
| E2E (API) | `e2e/notifications.spec.ts` | Thank populate, self-thank 400, mark-read |
| E2E (UI) | `e2e/thanks-ui.spec.ts` | Dialog submit on name/description detail, owner notifications, self-thank button hidden |
| E2E helpers | `e2e/helpers/thanks-ui.ts` | `openThanksDialog`, `submitThanksDialog`, toast assertion |

## Related

- [notifications-routes.md](notifications-routes.md) — thank notification list + mark-read
- [moderation-and-thanks.md](../../models/moderation-and-thanks.md) — `Thank` model
