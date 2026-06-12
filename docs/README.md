# Code notes

Heavy design and learning notes for converted TypeScript modules live here so source files stay readable.

## Conventions

| Doc type | Location | Example |
|----------|----------|---------|
| Module design notes | `docs/notes/<path>/<module>.md` | `docs/notes/utils/mongoDataCleanup.md` for `utils/mongoDataCleanup.ts` |
| TypeScript conventions | [type-vs-interface.md](notes/typescript/type-vs-interface.md) | When to use `type` vs `interface` in this repo |
| Migration note preservation | [preserving-migration-notes.md](notes/typescript/preserving-migration-notes.md) | Move long JS comments into `docs/notes/` on TS conversion |
| Operational changelog | [`CHANGES.md`](../CHANGES.md) | What changed, when, verification |
| Post-migration backlog | [`FUTURE.md`](FUTURE.md) | Deferred improvements (e.g. likes SSR hydration) |
| Testing | [`TESTING.md`](../TESTING.md) | Automated + manual verification checklists |

Each source file with notes should have a one-line pointer at the top linking to its markdown file. Notes files should include **code excerpts** (key functions, wiring, edge-case branches) so you can read behavior without opening the source.

## Index

| Source | Notes |
|--------|-------|
| [`utils/mongoDataCleanup.ts`](../utils/mongoDataCleanup.ts) | [mongoDataCleanup.md](notes/utils/mongoDataCleanup.md) |
| [`jest.setup.ts`](../jest.setup.ts) | [jest-setup.md](notes/jest-setup.md) |
| [`lib/auth.ts`](../lib/auth.ts) | [auth.md](notes/lib/auth.md) |
| [`lib/checkBlocklist.ts`](../lib/checkBlocklist.ts) | [checkBlocklist.md](notes/lib/checkBlocklist.md) |
| [`data/blockList.ts`](../data/blockList.ts) | [blockList.md](notes/data/blockList.md) |
| [`components/ui/LoadingSpinner.tsx`](../components/ui/LoadingSpinner.tsx), [`MustLoginMessage.tsx`](../components/ui/MustLoginMessage.tsx) | [small-ui-components.md](notes/components/ui/small-ui-components.md) |
| [`components/ReusableSmallComponents/buttons/`](../components/ReusableSmallComponents/buttons/) | [reusable-buttons.md](notes/components/reusable-buttons.md) |
| [`components/ReusableSmallComponents/`](../components/ReusableSmallComponents/) (images, headings, icons) | [reusable-small-components.md](notes/components/reusable-small-components.md) |
| YouTube embed + profile follow/follower modals | [youtube-and-social-lists.md](notes/components/showing-list-of-content/youtube-and-social-lists.md) |
| [`app/actions/sendContactEmail.ts`](../app/actions/sendContactEmail.ts) | [sendContactEmail.md](notes/app/actions/sendContactEmail.md) |
| [`components/Contact/ContactForm.tsx`](../components/Contact/ContactForm.tsx) | [sendContactEmail.md](notes/app/actions/sendContactEmail.md) (client form) |
| [`app/api/names/route.ts`](../app/api/names/route.ts) | [names-route.md](notes/app/api/names-route.md) |
| [`app/api/names/swr/route.ts`](../app/api/names/swr/route.ts) | [names-swr-route.md](notes/app/api/names-swr-route.md) |
| [`app/api/description/route.ts`](../app/api/description/route.ts) | [description-route.md](notes/app/api/description-route.md) |
| [`app/api/description/swr/route.ts`](../app/api/description/swr/route.ts) | [description-swr-route.md](notes/app/api/description-swr-route.md) |
| [`app/layout.tsx`](../app/layout.tsx) | [root-layout.md](notes/app/root-layout.md) |
| [`app/page.tsx`](../app/page.tsx), [`HeroTop.tsx`](../components/LandingPage/HeroTop.tsx) | [landing-page.md](notes/app/landing-page.md) |
| [`MediaObjectLeft.tsx`](../components/ReusableMediumComponents/MediaObjectLeft.tsx), [`MediaObjectRight.tsx`](../components/ReusableMediumComponents/MediaObjectRight.tsx) | [media-object.md](notes/components/media-object.md) |
| [`Footer.tsx`](../components/footer/Footer.tsx), [`FooterLink.tsx`](../components/footer/FooterLink.tsx) | [footer.md](notes/components/footer.md) |
| [`app/about/page.tsx`](../app/about/page.tsx) | [about-page.md](notes/app/about-page.md) |
| [`app/(protected)/editsettings/page.tsx`](../app/(protected)/editsettings/page.tsx) | [editsettings-page.md](notes/app/editsettings-page.md) |
| [`app/(protected)/layout.tsx`](../app/(protected)/layout.tsx) | [protected-layout.md](notes/app/protected-layout.md) |
| [`app/(admin)/`](../app/(admin)/) (layout + category/tag admin pages) | [admin-route-group.md](notes/app/admin-route-group.md) |
| [`app/api/categories-and-tags/route.ts`](../app/api/categories-and-tags/route.ts) | [categories-and-tags-route.md](notes/app/api/categories-and-tags-route.md) |
| [`app/api/auth/signup/route.ts`](../app/api/auth/signup/route.ts) | [signup-route.md](notes/app/api/signup-route.md) |
| Names + description check-if-exists routes | [check-if-content-exists.md](notes/app/api/check-if-content-exists.md) |
| [`app/api/user/grabusersfollowing/[userid]/route.ts`](../app/api/user/grabusersfollowing/[userid]/route.ts) | [grabusersfollowing-route.md](notes/app/api/grabusersfollowing-route.md) |
| [`app/api/user/updatefollows/route.ts`](../app/api/user/updatefollows/route.ts) | [updatefollows-route.md](notes/app/api/updatefollows-route.md) |
| Names + description togglelike routes | [togglelike-route.md](notes/app/api/togglelike-route.md) |
| [`app/api/user/likes/route.ts`](../app/api/user/likes/route.ts), [`context/LikesContext.tsx`](../context/LikesContext.tsx), [`LikesWrapper.tsx`](../wrappers/LikesWrapper.tsx), [`hooks/useLikeState.ts`](../hooks/useLikeState.ts), [`hooks/useToggleState.ts`](../hooks/useToggleState.ts) | [user-likes-route.md](notes/app/api/user-likes-route.md), [togglelike-route.md](notes/app/api/togglelike-route.md) |
| Notification API routes (`names`, `descriptions`, `thanks`, `user/notifications`) | [notifications-routes.md](notes/app/api/notifications-routes.md) |
| Thanks API (`/api/thanks`, get-thanks-count) + thanks UI stack | [thanks-route.md](notes/app/api/thanks-route.md), [moderation-and-thanks.md](notes/models/moderation-and-thanks.md) |
| Suggestion + flag/report API routes | [suggestion-route.md](notes/app/api/suggestion-route.md), [flag-routes.md](notes/app/api/flag-routes.md) |
| Notifications stack (`page`, tabs, listings, [`NotificationsButton.tsx`](../components/Notifications/NotificationsButton.tsx), context, wrapper, `useSwrSimple`, `user/notifications` API) | [notifications-page.md](notes/app/notifications-page.md) |
| [`app/(protected)/dashboard/page.tsx`](../app/(protected)/dashboard/page.tsx), [`dashboard.tsx`](../components/dashboard.tsx) | [dashboard-page.md](notes/app/dashboard-page.md), [dashboard.md](notes/components/dashboard.md) |
| [`app/fetchname/page.tsx`](../app/fetchname/page.tsx) | [fetchname-page.md](notes/app/fetchname-page.md) |
| [`app/addnames/page.tsx`](../app/addnames/page.tsx) | [addnames-page.md](notes/app/addnames-page.md) |
| [`app/adddescriptions/page.tsx`](../app/adddescriptions/page.tsx) | [adddescriptions-page.md](notes/app/adddescriptions-page.md) |
| [`app/fetchnames/page.tsx`](../app/fetchnames/page.tsx) | [fetchnames-page.md](notes/app/fetchnames-page.md) |
| [`app/fetchdescriptions/page.tsx`](../app/fetchdescriptions/page.tsx) | [fetchdescriptions-page.md](notes/app/fetchdescriptions-page.md) |
| [`app/profile/[profilename]/page.tsx`](../app/profile/[profilename]/page.tsx), [`profile.tsx`](../components/profile.tsx) | [profile-page.md](notes/app/profile-page.md), [profile.md](notes/components/profile.md) |
| [`models/NameLike.ts`](../models/NameLike.ts), [`DescriptionLike.ts`](../models/DescriptionLike.ts), [`Follow.ts`](../models/Follow.ts) | [likes-and-follows.md](notes/models/likes-and-follows.md) |
| [`models/Thank.ts`](../models/Thank.ts), [`Suggestion.ts`](../models/Suggestion.ts), [`Report.ts`](../models/Report.ts) | [moderation-and-thanks.md](notes/models/moderation-and-thanks.md) |
| [`hooks/useThanksHandler.ts`](../hooks/useThanksHandler.ts) | [useThanksHandler.md](notes/hooks/useThanksHandler.md) |
| [`hooks/useFlagging.ts`](../hooks/useFlagging.ts) | [useFlagging.md](notes/hooks/useFlagging.md) |
| [`AddReport.tsx`](../components/Flagging/AddReport.tsx), [`EditReport.tsx`](../components/Flagging/EditReport.tsx) | [flag-report-forms.md](notes/components/flag-report-forms.md) |
| [`DeleteContentNotification.tsx`](../components/DeletingData/DeleteContentNotification.tsx) | [delete-content-notification.md](notes/components/delete-content-notification.md) |
| [`hooks/useSuggest.ts`](../hooks/useSuggest.ts) | [useSuggest.md](notes/hooks/useSuggest.md) |
| [`AddSuggestion.tsx`](../components/Suggestions/AddSuggestion.tsx), [`EditSuggestion.tsx`](../components/Suggestions/EditSuggestion.tsx) | [suggestion-forms.md](notes/components/suggestion-forms.md) |
| [`hooks/useDeleteConfirmation.ts`](../hooks/useDeleteConfirmation.ts) | [useDeleteConfirmation.md](notes/hooks/useDeleteConfirmation.md) |
| [`context/ReportsContext.tsx`](../context/ReportsContext.tsx), [`context/SuggestionsContext.tsx`](../context/SuggestionsContext.tsx) | [moderation-and-thanks.md](notes/models/moderation-and-thanks.md) |
| [`hooks/useEditHandler.ts`](../hooks/useEditHandler.ts), [`EditContent.tsx`](../components/EditingData/EditContent.tsx), [`EditButton.tsx`](../components/ReusableSmallComponents/buttons/EditButton.tsx) | [useEditHandler.md](notes/hooks/useEditHandler.md) |
| [`hooks/useTags.ts`](../hooks/useTags.ts), [`TagsSelectAndCheatSheet.tsx`](../components/FormComponents/TagsSelectAndCheatSheet.tsx) | [useTags.md](notes/hooks/useTags.md), [tags-select-and-cheat-sheet.md](notes/components/tags-select-and-cheat-sheet.md) |
| [`CategoriesAndTagsContext.tsx`](../context/CategoriesAndTagsContext.tsx), [`useCategoriesForDataType.ts`](../hooks/useCategoriesForDataType.ts), [`CategTagsWrapper.tsx`](../wrappers/CategTagsWrapper.tsx) | [categories-and-tags.md](notes/context/categories-and-tags.md) |
| [`context/AdminContext.tsx`](../context/AdminContext.tsx), [`AdminWrapper.tsx`](../wrappers/AdminWrapper.tsx), [`AdminDropdownMenu.tsx`](../components/NavBar/NavBarPieces/DesktopNavBar/AdminDropdownMenu.tsx) | [admin-context.md](notes/context/admin-context.md) |
| [`NavLayoutwithSettingsMenu.tsx`](../components/NavBar/NavLayoutwithSettingsMenu.tsx) + NavBar pieces | [navbar.md](notes/components/navbar.md) |
| Layout wrappers (`SessionProviderWrapper`, `ToastWrapper`, `ReportsWrapper`, `SuggestionsWrapper`, …) | [layout-wrappers.md](notes/wrappers/layout-wrappers.md) |
| [`addingName.tsx`](../components/AddingNewData/addingName.tsx), [`addingdescription.tsx`](../components/AddingNewData/addingdescription.tsx) | [add-content-forms.md](notes/components/add-content-forms.md) |
| [`CheckIfContentExists.tsx`](../components/AddingNewData/CheckIfContentExists.tsx) | [check-if-content-exists.md](notes/components/check-if-content-exists.md) |
| [`StyledCheckbox.tsx`](../components/FormComponents/StyledCheckbox.tsx), [`StyledInput.tsx`](../components/FormComponents/StyledInput.tsx), [`StyledTextarea.tsx`](../components/FormComponents/StyledTextarea.tsx), [`StyledSelect.tsx`](../components/FormComponents/StyledSelect.tsx), [`RegisterInput.tsx`](../components/FormComponents/RegisterInput.tsx) | [form-components.md](notes/components/form-components.md) |
| [`CoreListingPagesLogic.tsx`](../components/CoreListingPagesLogic.tsx) | [core-listing-pages-logic.md](notes/components/core-listing-pages-logic.md) |
| [`useSwrPagination.ts`](../hooks/useSwrPagination.ts) | [useSwrPagination.md](notes/hooks/useSwrPagination.md) |
| [`pagination.tsx`](../components/ShowingListOfContent/pagination.tsx) | [pagination.md](notes/components/pagination.md) |
| [`FilteringSidebar.tsx`](../components/Filtering/FilteringSidebar.tsx) | [filtering-sidebar.md](notes/components/filtering-sidebar.md) |
| [`ToggleOneContentPage.tsx`](../components/ShowingListOfContent/ToggleOneContentPage.tsx) | [toggle-one-content-page.md](notes/components/toggle-one-content-page.md) |
| [`dashboard.tsx`](../components/dashboard.tsx) | [dashboard.md](notes/components/dashboard.md) |
| [`profile.tsx`](../components/profile.tsx) | [profile.md](notes/components/profile.md) |
| [`ContentListing.tsx`](../components/ShowingListOfContent/ContentListing.tsx) | [content-listing.md](notes/components/content-listing.md) |
| [`models/Name.ts`](../models/Name.ts), [`Description.ts`](../models/Description.ts) | [name-and-description.md](notes/models/name-and-description.md) |
| [`app/name/[name]/page.tsx`](../app/name/[name]/page.tsx) | [name-page.md](notes/app/name-page.md) |
| [`app/description/[id]/page.tsx`](../app/description/[id]/page.tsx) | [description-page.md](notes/app/description-page.md) |
| [`utils/stringManipulation/findNormalizedMatch.ts`](../utils/stringManipulation/findNormalizedMatch.ts) | [findNormalizedMatch.md](notes/utils/stringManipulation/findNormalizedMatch.md) |
