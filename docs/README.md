# Code notes

Heavy design and learning notes for converted TypeScript modules live here so source files stay readable.

## Conventions

| Doc type | Location | Example |
|----------|----------|---------|
| Module design notes | `docs/notes/<path>/<module>.md` | `docs/notes/utils/mongoDataCleanup.md` for `utils/mongoDataCleanup.ts` |
| Operational changelog | [`CHANGES.md`](../CHANGES.md) | What changed, when, verification |
| Testing | [`TESTING.md`](../TESTING.md) | Automated + manual verification checklists |

Each source file with notes should have a one-line pointer at the top linking to its markdown file.

## Index

| Source | Notes |
|--------|-------|
| [`utils/mongoDataCleanup.ts`](../utils/mongoDataCleanup.ts) | [mongoDataCleanup.md](notes/utils/mongoDataCleanup.md) |
| [`jest.setup.ts`](../jest.setup.ts) | [jest-setup.md](notes/jest-setup.md) |
| [`lib/auth.ts`](../lib/auth.ts) | [auth.md](notes/lib/auth.md) |
| [`lib/checkBlocklist.ts`](../lib/checkBlocklist.ts) | [checkBlocklist.md](notes/lib/checkBlocklist.md) |
| [`app/actions/sendContactEmail.ts`](../app/actions/sendContactEmail.ts) | [sendContactEmail.md](notes/app/actions/sendContactEmail.md) |
| [`components/Contact/ContactForm.tsx`](../components/Contact/ContactForm.tsx) | [sendContactEmail.md](notes/app/actions/sendContactEmail.md) (client form) |
| [`app/api/names/route.ts`](../app/api/names/route.ts) | [names-route.md](notes/app/api/names-route.md) |
| [`app/api/names/swr/route.ts`](../app/api/names/swr/route.ts) | [names-swr-route.md](notes/app/api/names-swr-route.md) |
| [`app/api/description/route.ts`](../app/api/description/route.ts) | [description-route.md](notes/app/api/description-route.md) |
| [`app/api/description/swr/route.ts`](../app/api/description/swr/route.ts) | [description-swr-route.md](notes/app/api/description-swr-route.md) |
| [`app/api/auth/signup/route.ts`](../app/api/auth/signup/route.ts) | [signup-route.md](notes/app/api/signup-route.md) |
| Names + description check-if-exists routes | [check-if-content-exists.md](notes/app/api/check-if-content-exists.md) |
| [`app/api/user/grabusersfollowing/[userid]/route.ts`](../app/api/user/grabusersfollowing/[userid]/route.ts) | [grabusersfollowing-route.md](notes/app/api/grabusersfollowing-route.md) |
| [`app/api/user/updatefollows/route.ts`](../app/api/user/updatefollows/route.ts) | [updatefollows-route.md](notes/app/api/updatefollows-route.md) |
| Names + description togglelike routes | [togglelike-route.md](notes/app/api/togglelike-route.md) |
| [`app/api/user/likes/route.ts`](../app/api/user/likes/route.ts), [`context/LikesContext.tsx`](../context/LikesContext.tsx), [`LikesWrapper.tsx`](../wrappers/LikesWrapper.tsx), [`hooks/useLikeState.ts`](../hooks/useLikeState.ts), [`hooks/useToggleState.ts`](../hooks/useToggleState.ts) | [user-likes-route.md](notes/app/api/user-likes-route.md), [togglelike-route.md](notes/app/api/togglelike-route.md) |
| Notification API routes (`names`, `descriptions`, `thanks`, `user/notifications`) | [notifications-routes.md](notes/app/api/notifications-routes.md) |
| Notifications stack (`page`, tabs, listings, [`NotificationsButton.tsx`](../components/Notifications/NotificationsButton.tsx), context, wrapper, `useSwrSimple`, `user/notifications` API) | [notifications-page.md](notes/app/notifications-page.md) |
| [`models/NameLike.ts`](../models/NameLike.ts), [`DescriptionLike.ts`](../models/DescriptionLike.ts), [`Follow.ts`](../models/Follow.ts) | [likes-and-follows.md](notes/models/likes-and-follows.md) |
| [`models/Thank.ts`](../models/Thank.ts), [`Suggestion.ts`](../models/Suggestion.ts), [`Report.ts`](../models/Report.ts) | [moderation-and-thanks.md](notes/models/moderation-and-thanks.md) |
| [`models/Name.ts`](../models/Name.ts), [`Description.ts`](../models/Description.ts) | [name-and-description.md](notes/models/name-and-description.md) |
| [`utils/stringManipulation/findNormalizedMatch.ts`](../utils/stringManipulation/findNormalizedMatch.ts) | [findNormalizedMatch.md](notes/utils/stringManipulation/findNormalizedMatch.md) |
