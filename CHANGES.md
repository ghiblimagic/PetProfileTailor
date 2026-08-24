# CHANGES

## 2026-08-23 — Tags cheat sheet checkboxes: grid layout instead of flex-wrap

`TagsSelectAndCheatSheet.tsx`'s per-category checkbox list
(`components/FormComponents/TagsSelectAndCheatSheet.tsx`) used
`flex flex-wrap`, which packs checkboxes left-to-right with no column
alignment — looked messy, especially with a mix of short and long tag
labels. Switched the container to `grid grid-cols-1 lg:grid-cols-2 gap-4`:
one column on small screens, two on large screens, each row's height
following its own tallest (wrapped) label rather than the whole list's
flow being thrown off. Also dropped a dead `mb-4y` class (invalid
Tailwind utility, had no effect) in favor of `mb-4`.

## 2026-08-23 — Landing video tests also needed the poster's Play click, not just the open button

Follow-up to the entry below: fixing the `close X` → `Close video` name and
the `?autoplay=1` locator got the assertions matching the right elements,
but all 7 `landing-videos.spec.ts` tests still failed with the iframe never
appearing (and the network test's `waitForRequest` timing out). Root cause
the user correctly diagnosed: `YoutubeEmbed`'s poster/iframe split
(`started` state) means clicking the landing page's "Fun"/"Impactful"/
"Fitting" button only mounts the poster — the iframe (and the YouTube
embed request) doesn't render until the poster's own
`aria-label="Play video: {title}"` button is clicked. The button-labeled
tests were never doing that second click.

Added `playLandingVideoButton(page, title)` to
`e2e/helpers/landing-videos.ts` and inserted it between every
`openLandingVideoButton` call and the following
`expectLandingVideoLoaded`/`waitForRequest` across the spec (the "toggle
closed" test's second `openLandingVideoButton` call is unaffected — that
one only needs to close an already-open panel).

Verified with `tsc --noEmit` (clean) — still haven't run the Playwright
suite itself locally (needs live credentials/app), so worth confirming on
the next CI run.

## 2026-08-23 — Fixed stale e2e tests broken by tag-required submit and YouTube embed changes

CI had 7 failing Playwright tests across two unrelated causes — both were
the app's product code changing out from under tests that were never
updated to match, not app regressions:

**Tag now required to submit a description.** The submit-button-disabled
logic added in the "enhance submit button logic and styling" commit now
requires at least one tag to be selected (matches the "Tags *required"
label that was already on the form, and is covered by
`addingdescription.test.tsx`). But `e2e/adddescriptions.spec.ts`'s "submits
a unique description" and "rejects blocklisted substring" tests, and
`e2e/helpers/delete-content-ui.ts`'s `createUniqueDescriptionViaUi`, filled
the description and clicked submit without ever picking a tag — so the
button stayed disabled forever and `waitForResponse`/`.click()` timed out.
Fixed by having all three call the existing
`openDescriptionTagsCheatSheet` / `selectDescriptionTagInCheatSheet`
helpers (already used by `submitDescriptionWithTags`) before submitting.

**Landing page video embed markup changed.** The "Refactor components for
improved styling and consistency" commit added `?autoplay=1` to the
YouTube iframe `src` and changed the close button from
`text="close X"` to `ariaLabel="Close video"` (`text="✕"` is what's
visually rendered now; the aria-label is what accessibility-tree queries
match). `e2e/helpers/landing-videos.ts`'s `landingVideoIframe` locator did
an exact `src` match (so it never found the iframe once the query param
was added) and both it and `expectLandingVideoLoaded`/`closeLandingVideo`
looked for a button named "close X" (no longer the accessible name).
Fixed the iframe locator to use a `[src^="..."]` starts-with match (so it
keeps working if the query string changes again), updated the button
lookups to "Close video", and updated the one test that asserted the
literal `src` value to include `?autoplay=1`.

Verified with `tsc --noEmit`, `pnpm lint`, and
`vitest run components/AddingNewData/addingdescription.test.tsx` (all
clean/passing) — didn't run the Playwright suite itself locally (needs
`PLAYWRIGHT_TEST_EMAIL`/`PASSWORD` and a running app), so worth confirming
green on the next CI run.

## 2026-08-23 — `ContentListing`'s action row (likes/share/thanks) now centers instead of right-pinning thanks

On narrow screens the likes/share/thanks row (`flex flex-wrap`) couldn't
fit all three, so `ThanksButton` wrapped to its own line — but it was
wrapped in an `ml-auto` div meant to pin it to the far right of the *wide*
layout, so on its wrapped line it stayed jammed against the right edge
while the row above sat left-aligned. Looked unintentional/lopsided.

Removed the `ml-auto` wrapper (redundant now — the div existed only to
hold that class) and added `justify-center` to the row. Flexbox centers
each wrapped line independently, so on a narrow screen where thanks wraps
alone, it now centers on its own line instead of sticking to one side;
the two-item line above centers too, which reads as one coherent
(intentionally centered) row rather than a stray leftover button.

Not run: per session preference, no test/typecheck run for this pure
Tailwind class change — worth a look at a narrow viewport in the browser.

## 2026-08-23 — Test coverage for the submit-button disabled-reason logic

Added `components/AddingNewData/addingdescription.test.tsx` covering the
`submitDisabledReason` logic from the previous two entries: signed-out,
signed-in-but-too-short, signed-in-with-no-tag, and the fully-enabled case
(typed a description, opened the cheat sheet, expanded its one category,
and actually clicked its one tag checkbox — a real interaction, not a
prop/state shortcut, since there's no prop to inject `tagsToSubmit`
directly).

Mocked `next-auth/react`'s `useSession` (`vi.hoisted` + `mockReturnValue`,
same pattern as `LikesContext.test.tsx`) to flip signed-in/signed-out per
test, `next/image` (same stub as `RegisterForm.test.tsx`), and
`@/hooks/useCategoriesForDataType` (same approach as
`TagsSelectAndCheatSheet.test.tsx`) with one category/tag so the select
field's `tagList` and the cheat sheet's checkbox refer to the same tag —
needed for the "select a tag through the UI" case to actually work.

Verified the tag-requirement test is a real regression guard, not a
false-positive pass: temporarily reverted the `tagsToSubmit.length === 0`
check to `false` and confirmed that specific test failed (button was not
disabled), then restored the real check and reran — 4/4 passing. `tsc
--noEmit` clean.

## 2026-08-23 — Bugfix: submit button's "(disabled)" label didn't cover all disabled reasons

`addingdescription.tsx`'s submit button had `disabled={!session ||
newDescription.length < 10}` but its label only appended `"(disabled)"`
for the `!session` case: `` `Add description ${!session ? "(disabled)" : ""}` ``.
So a signed-in user who'd typed fewer than 10 characters saw a
button that looked active but did nothing when clicked, with no visible
reason why.

First fix: hoisted the condition into a single `submitDisabled` const and
drove both the button's `disabled` prop and its label off it. Follow-up,
after discussing whether a bare "(disabled)" suffix was worth keeping at
all: replaced it with a reason-specific `submitDisabledReason` string
(`" (sign in to submit)"` / `" (min. 10 characters)"`) instead of a
generic "(disabled)" tag — `GeneralButton`'s own disabled styling and the
native `disabled` attribute already convey *that* the button is inert
(both to sighted users and screen readers), so a bare "(disabled)" wasn't
adding much; naming the actual blocker in the label tells the user what to
fix without having to go hunting for the sign-in banner or the guidelines
text above the form.

Second follow-up: the button wasn't disabled for having zero tags
selected at all — `handleDescriptionSubmission` posts `tags: tagIds`
either way, so a description with no tags could be submitted. Added a
third `tagsToSubmit.length === 0` → `" (select at least 1 tag)"` branch.
Had to move the `useTags()` call (which owns `tagsToSubmit`) above the new
`submitDisabledReason` const — it was declared using a value not in scope
yet ("used before its declaration").

Not run: user asked not to run tests this session — worth a manual check
in the browser (type <10 characters while signed in → "Add description
(min. 10 characters)"; signed out → "Add description (sign in to
submit)"; 10+ characters with zero tags picked → "Add description (select
at least 1 tag)").

## 2026-08-23 — `<hr>` border color is now a sitewide default

`TagsSelectAndCheatSheet.tsx`'s category-divider `<hr className="mx-6
border-t border-subtleBorder" />` was the only `<hr>` in the codebase with
explicit border styling — the other (`addingName.tsx`) had none, so it
fell through to the app's generic `* { @apply border-border }` rule (a
near-white/gray shadcn token), not `subtleBorder`.

Added `hr { @apply border-subtleBorder; }` to `styles/globals.css`'s base
layer (next to the `p`/`h1`–`h6` defaults) so every `<hr>` gets the same
border color by default. `hr` (specificity 0,0,1) naturally wins over the
`* { @apply border-border }` rule (0,0,0) regardless of source order, so
no `!important` needed. Left margins/width to each call site — spacing is
layout-specific, not a sitewide token — so `TagsSelectAndCheatSheet.tsx`'s
`<hr>` simplified to just `className="mx-6"` (dropped the now-redundant
`border-t border-subtleBorder`).

Side effect: `addingName.tsx`'s bare `<hr className="mt-4" />` and
`addingdescription.tsx`'s bare `<hr />` now pick up `subtleBorder` instead
of the generic gray — a visual change, but one that makes them consistent
with the rest of the site rather than an oversight worth preserving.

## 2026-08-23 — Bugfix: `TagPillMultiValue` crashed with "innerProps is undefined"

Regression from the previous entry below — reported by the user as a
runtime crash the moment a tag was already selected or got selected
("innerProps is undefined"). `tsc --noEmit` and the full test suite were
both clean because nothing exercised the crashing render path (no test
selected a tag; `MultiValueProps['innerProps']` is typed as required, so
`tsc` had no reason to flag reading it).

Root cause: react-select's own `Select.js` (`renderPlaceholderOrValue`)
renders the top-level `MultiValue` element with only `data`/`removeProps`/
`isDisabled`/`isFocused`/`components`/`selectProps` — it does **not** pass
`innerProps` there. `innerProps` only exists for the `Container`/`Label`/
`Remove` **sub-components**, computed internally by react-select's own
default `MultiValue` implementation (in `index-*.cjs.dev.js`) — which
`TagPillMultiValue` replaces entirely. So `props.innerProps` is genuinely
`undefined` at this level despite the `.d.ts` typing it as required;
destructuring it (`const { ref, ...spanProps } = innerProps`) threw.

Fix: dropped `innerProps` from `TagPillMultiValue` entirely — it was only
being used to grab a stray `className`/`ref` that don't need preserving
here. Also hid the remove ("×") button when the whole select is
`isDisabled`, matching how a disabled field shouldn't offer removal.

Added `TagsSelectAndCheatSheet.test.tsx` (mocks `useCategoriesForDataType`
to avoid needing `CategoriesAndTagsContext`) asserting a pre-selected tag
renders as a pill with a working remove button — confirmed it reproduces
this exact crash against the broken code (`Cannot destructure property
'ref' of 'innerProps' as it is undefined`) before verifying it passes
against the fix. `tsc --noEmit` clean; `StyledCheckbox.test.tsx` +
`TagsSelectAndCheatSheet.test.tsx` both green.

## 2026-08-23 — Selected tags in `TagsSelectAndCheatSheet`'s select field now match `ContentListing`'s tag pills

Extracted the `"#tag"` pill markup — previously duplicated verbatim in
`ContentListing.tsx` and `addingdescription.tsx`'s tag preview
(`bg-white/10 text-subtleWhite text-xs px-3 py-1 rounded-full min-w-0
max-w-full break-words`, `#`-prefixed) — into a new
`components/Shared/typography/TagPill.tsx`. Both call sites now render
`<TagPill>{tag}</TagPill>`.

For `TagsSelectAndCheatSheet.tsx`'s react-select field, the selected-tag
chips were react-select's own boxy default (`var(--select-bg-secondary)`
pill via the `multiValue`/`multiValueLabel`/`multiValueRemove` entries in
`customSelectStyles`) — visually unrelated to the `TagPill` style used
everywhere else tags are shown. Since react-select applies its per-part
`styles` via its own emotion CSS-in-JS (not classes), matching the
Tailwind look exactly meant fully replacing rendering, not just tweaking
style objects — a `TagPillMultiValue` component overrides `components.
MultiValue` on the `<Select>`, rendering the exact same `tagPillClassName`
(now exported from `TagPill.tsx` for this reason) with a small "×" remove
button wired to react-select's own `removeProps` handlers. Removed the
now-dead `multiValue`/`multiValueLabel`/`multiValueRemove` style functions
since a fully custom `MultiValue` bypasses react-select's internal
Container/Label/Remove sub-components entirely — they'd never run.

Problem encountered: react-select types `removeProps`/`innerProps` as
plain `<div>` props (its own default `MultiValueRemove`/`MultiValueContainer`
render divs), which don't structurally match a `<button>`'s HTML attribute
types (mismatched event-handler element generics, e.g. `onCopy:
ClipboardEventHandler<HTMLDivElement>`). Checked react-select's actual
source (`Select-*.cjs.dev.js`) and confirmed `removeProps` is just `{
onClick, onTouchEnd }` at runtime — the div typing is an artifact of its
own default implementation, not a real constraint — so cast it to
`ComponentPropsWithoutRef<"button">` for the spread rather than fighting
the types or switching to a `<div role="button">`.

Verified with `tsc --noEmit` (clean) and the full `vitest` suite (268/270
passing — the 2 failures are in `CheckIfContentExists.test.tsx`, a file
untouched by this change, and pre-date it).

## 2026-08-23 — `StyledCheckbox` box shrunk slightly without shrinking the icon

Shrunk the box from `w-8 h-8`/`p-[7px]` to `w-7 h-7`/`p-[5px]`. The
`FontAwesomeIcon` itself wasn't touched — it renders at `1em`, sized off
inherited font-size, not off the box's padding/dimensions — so trimming
the box's padding shrinks the box without shrinking the icon; there's just
less empty space around it. (The two knobs are independent: box size —
`w-*`/`h-*`/`p-[*]` on the `<span>` — vs. icon size — a `className`/`size`
prop on `<FontAwesomeIcon>` itself. Only the first was touched here.)
Verified with `tsc --noEmit` and `StyledCheckbox.test.tsx` (4/4, no
behavior change).

## 2026-08-23 — `StyledCheckbox` box no longer resizes when the icon appears

The icon box `<span>` had no fixed size — just `p-[7px]` padding — so it
sized to its content. With the paw icon now only rendering once `checked`
(previous entry below), the box visibly grew/shrank on every toggle:
empty content collapsed it down to roughly the padding alone, while the
icon's `<svg>` pushed it back out, shifting the label text next to it.

Fixed by giving the box a fixed `w-8 h-8 shrink-0` (2rem square,
`shrink-0` so the flex row can't compress it either) so its size no longer
depends on whether the icon is present. Fixed in `StyledCheckbox.tsx`
itself rather than per-consumer, since the same box/icon markup is shared
by every consumer (filter sidebar, add/edit forms, cheat-sheet tags).
Verified with `tsc --noEmit` and `StyledCheckbox.test.tsx` (still 4/4 —
purely a visual/layout change, no behavior change).

## 2026-08-23 — `TagsSelectAndCheatSheet` cheat-sheet checkboxes now reuse `StyledCheckbox`

`TagsSelectAndCheatSheet.tsx`'s per-tag checkboxes were a hand-rolled copy
of `StyledCheckbox.tsx`'s markup (same hidden-native-input technique, same
paw-icon box) that had already drifted — it had the "icon only shows when
checked" behavior before that was added to `StyledCheckbox` itself in the
previous entry below.

Compared the two implementations before merging. Differences found:
hover treatment (`group`/`group-hover:bg-blue-700` on the box, `hover:` on
the label — `StyledCheckbox` had none), disabled box background
(`bg-errorBackgroundColor`, vs. just `cursor-not-allowed`), and label
weight (plain vs. `StyledCheckbox`'s hardcoded `font-bold`). Everything
else already matched: the `onChange` callback here was already a plain
`ChangeEventHandler<HTMLInputElement>`, and `tag._id` already served the
same role as `StyledCheckbox`'s `value`.

Added two additive, opt-in props to `StyledCheckbox` rather than baking
the cheat sheet's look in for every consumer:
- `boxClassName` — extra classes on the icon box (`<span>`), since
  `className` only reaches the outer `<label>`.
- `labelClassName` — replaces the label text span's classes (default
  `"font-bold"`, unchanged for existing consumers); cheat sheet passes
  `"text-left"`.

Then replaced the inline `<label>`/`<input>`/icon-box markup in
`TagsSelectAndCheatSheet.tsx` with `<StyledCheckbox>`, dropped its now-
unused `FontAwesomeIcon`/`faPaw` imports, and updated
`docs/notes/components/form-components.md` and
`docs/notes/components/tags-select-and-cheat-sheet.md` to describe the new
props and the consumer. Verified with `tsc --noEmit` and the existing
`StyledCheckbox.test.tsx` suite (4 tests, all passing) — no test file
existed yet for `TagsSelectAndCheatSheet.tsx` itself.

## 2026-08-23 — `StyledCheckbox` paw icon only shows when checked

`components/FormComponents/StyledCheckbox.tsx` previously always rendered
the `faPaw` icon and only recolored it via `peer-checked:text-secondary`
against the box's `bg-secondary`/`peer-checked:bg-yellow-300` background —
so the paw was always visible, just low-contrast against the unchecked
box. Changed to `{checked && <FontAwesomeIcon icon={faPaw} />}` so the icon
only renders once the checkbox is actually checked, using the `checked`
prop the component already receives rather than adding CSS.

Considered a CSS-only route (`peer-checked:[&>svg]:opacity-100` on the
span, since the icon's `<svg>` isn't a direct sibling of the `peer` input
and plain `peer-checked:` can't reach it) but picked the prop-driven
conditional instead — it's simpler, avoids a non-obvious arbitrary-variant
selector, and the box's border still shows the empty-checkbox shape when
unchecked.

## 2026-08-23 — `secondaryText` promoted to a CSS variable; applied to all `<p>` by default

Moved the `secondaryText` color off a literal `oklch(0.88 0.005 260 / 0.7)`
value duplicated in `tailwind.config.js` and onto a single `--secondary-text`
CSS variable defined in `styles/globals.css` (`@layer base` `:root`, next to
the existing `--subtle-border`/`--field-background` vars). Tailwind's
`secondaryText` token now reads `var(--secondary-text)` instead of repeating
the value, and `styles/globals.css` adds a base-layer `p { @apply
text-secondaryText; }` so paragraphs get the de-emphasized color by default
without needing `text-secondaryText` on every call site.

Reasoning: the user wants multiple visual themes later. With the color only
living in `tailwind.config.js`, a future theme would need Tailwind config
changes (and a rebuild) to swap it. Sourcing it from a CSS variable means a
future theme can override `--secondary-text` (and sibling tokens) per
selector/data-attribute at runtime — Tailwind's `text-secondaryText`
utility and the new base `p` rule keep working unchanged since both just
resolve `var(--secondary-text)`.

No visual regression expected: existing components that already set
`text-secondaryText` explicitly on `<p>` tags (`AddSuggestion.tsx`,
`addingdescription.tsx`, `preserveTextAfterSubmission.tsx`,
`TagsSelectAndCheatSheet.tsx`) keep doing so redundantly but harmlessly;
`<p>` tags elsewhere pick up the new default instead of falling through to
`body`'s `text-foreground`. Verified by compiling `styles/globals.css`
through the Tailwind CLI and confirming both the `--secondary-text` var and
the `p { color: var(--secondary-text) }` rule land in the output.

## 2026-08-23 — Styling: `/adddescriptions` text colors/weight — first pass

Explored alternative page shells for `/adddescriptions` as a design-comparison
Artifact first (three options: numbered steps, reference rail, quiet
minimal), settled on the quiet-minimal direction, then checked its text
contrast ratios against WCAG AA before touching real code. Full layout
restructure (left-alignment, section dividers, submit-button variant swap)
is deferred to a later pass — this first pass only touches text color and
font-weight in `components/AddingNewData/addingdescription.tsx`:

- Secondary/help copy (image caption, notes helper paragraphs, tags helper
  text, both character-count spans) now uses `text-subtleWhite/70` instead
  of full-opacity `subtleWhite`, to visually de-emphasize it relative to
  primary content. Checked at ~7.5:1 contrast against the page background —
  well clear of the 4.5:1 AA floor for that text size, not a bare pass.
- "Ruh Roh! This description already exists!" changed from `text-red-500`
  to `text-red-400` — `red-500` on the page's near-black background
  measured ~5.3:1 (passing, but thin); `red-400` measures ~7.2:1.
- "Tags *required" label changed from `font-bold` to `font-black`, matching
  "Description *required" — both are required fields and should carry the
  same visual weight; "Notes" (optional) stays `font-bold`.

No layout, spacing, or component-structure changes in this pass, and the
submit button's existing ad-hoc `yellow-300`/`violet-800`/`blue-500`
classes were left alone on purpose (flagged for the follow-up pass, not
this one).

Follow-up small edit: the example tags (`senior, funny, quiet,
well-behaved`) were plain text in that same caption. Reused the exact tag
pill styling from `ContentListing.tsx`
(`bg-white/10 text-subtleWhite text-xs px-3 py-1 rounded-full`, `#`-prefixed)
so the example tags read as actual tags instead of a comma-separated list.

Follow-up: promoted the ad hoc `text-subtleWhite/70` de-emphasis color used
throughout this pass into its own `secondaryText` token in
`tailwind.config.js` (`oklch(0.88 0.005 260 / 0.7)` — the same subtleWhite
hue baked to a fixed 70%), since it's meant to be reused sitewide for
help/caption text and shouldn't risk drifting to a different opacity at
each call site. Swapped `addingdescription.tsx`'s existing
`text-subtleWhite/70` usages over to `text-secondaryText`; no other
component in the codebase used that pattern yet, so there was nothing else
to migrate.

## 2026-08-22 — Bugfix: dashboard content rows — name/@handle centered, not next to image

### What was broken and why

User-reported (screenshot: `/dashboard`, all four tabs — Fav Names, Fav
Descriptions, Added Names, Added Descriptions): the profile image sat in
the right place, but the name + `@profileName` text was pulled away from
it — clearly not tucked next to the image the way it renders correctly on
`/fetchnames`/`/fetchdescriptions`, even though all three routes render the
exact same `ContentListing.tsx`.

First hypothesis (wrong, ruled out by screenshotting both states —
including the user's own visual check — before landing on this) was a
missing `w-full` on a flex-wrap ancestor in `dashboard.tsx` squeezing the
whole card's width. That didn't reproduce.

Actual root cause: `components/dashboard.tsx`'s outer `<section
className="... text-center">` sets `text-align: center`, and nothing in
the `ToggleOneContentPage` → `CoreListingPageLogic` → `ContentListing`
chain resets it — `text-align` inherits straight through. The name/handle
header row is `<a className="flex-1 min-w-0 flex flex-col leading-tight">`
— a flex-column container, so its `<span>` children stretch to the row's
full available width by default (`align-items: stretch`). The inherited
`text-center` then centers the _text_ inside those stretched spans,
visually separating it from the image even though the `<a>` is still the
very next flex item, tight against it. The content/notes block just below
in the same component already had its own `text-left` override for
exactly this reason (`<div className="flex flex-col gap-3 text-left
text-subtleWhite">`) — which is why the title and description render
correctly in the same screenshot — the header row above it never got the
same treatment. `/fetchnames`/`/fetchdescriptions` never sit under a
`text-center` ancestor, so this was never exposed there.

### Fix

Added `text-left` to `ContentListing`'s outermost root div instead of
patching `dashboard.tsx`'s `text-center` — this component gets embedded
under very different ancestor trees, so making the card immune to
whatever alignment an embedding page happens to set is more robust than
fixing the one ancestor found this time, and matches the pattern the
content/notes block already used.

### Files modified

- `components/ShowingListOfContent/ContentListing.tsx` — `text-left` on the root div.
- `docs/notes/components/content-listing.md` — documented why.

### Verification

- `pnpm exec tsc --noEmit` — clean.
- Not yet visually re-confirmed by the user (no browser testing was run for this fix, per their request after the first, wrong hypothesis below) — pending their check.

## 2026-08-22 — MediaObjectLeft/Right: center the button under the text block

### What was changed

The button wrapper in both `MediaObjectLeft.tsx` and `MediaObjectRight.tsx`
used `flex items-center` — `items-center` only affects cross-axis (vertical)
alignment in a flex row, so it did nothing to horizontally position the
button; `MediaObjectLeft` additionally had a leftover `ml-4`/`max-w-2xl`
indent. Changed both wrappers to `flex justify-center` (dropping the
indent), which centers the button within the same parent container the
bullet-list text block above it sits in.

### Files modified

- `components/Shared/layout/MediaObjectLeft.tsx`
- `components/Shared/layout/MediaObjectRight.tsx`

### Verification

- `pnpm exec tsc --noEmit` — clean.

## 2026-08-22 — LinkButton: add `secondary` flag; MediaObject buttonStyle mapping

### What was broken and why

User set `buttonStyle="secondary"` on two `MediaObjectRight`/`MediaObjectLeft`
call sites in `app/page.tsx`, expecting the `secondary` `LinkButton` look —
but nothing changed. Two compounding gaps:

1. `LinkButton` never had a `secondary` flag at all — its flag set was
   `defaultStyle`/`basic`/`subtle`/`warning`/`active`/`disabled` (`secondary`
   is a `GeneralButton`-only flag; see the "Unify GeneralButton + LinkButton
   styling" entry below for why they weren't fully unified).
2. `MediaObjectLeft.tsx`/`MediaObjectRight.tsx` only ever checked
   `buttonStyle === "subtle"`, hardcoded as a binary ternary — any other
   string (`"secondary"`, a typo, anything) silently fell through to the
   `else` branch and rendered `defaultStyle` instead. `buttonStyle="default"`
   happened to render correctly, but only by accident (it also isn't
   `"subtle"`, so it also fell into the same `else` branch) — the prop was
   never actually read for anything but a `"subtle"` check.

### Fix

- Added `secondary` to `LinkButtonProps` / `LinkButtonVariantFlags` /
  `resolveLinkButtonVariant()` in
  [buttonStyles.ts](components/Shared/actions/buttonStyles.ts) — maps onto
  the `"secondary"` entry `BUTTON_VARIANT_CLASSES` already had from
  `GeneralButton`, so no new colors were needed.
- New [`components/Shared/layout/mediaObjectButtonStyle.ts`](components/Shared/layout/mediaObjectButtonStyle.ts) —
  `MediaObjectButtonStyle` (`"default" | "subtle" | "secondary"`) and
  `mediaObjectLinkButtonFlags()`, a single mapping both `MediaObjectLeft`
  and `MediaObjectRight` call instead of each hand-rolling its own
  (previously binary, now 3-way) ternary — same "centralize it so the two
  copies can't drift apart" reasoning as `buttonStyles.ts` itself.
  `buttonStyle` is now typed as that union instead of a bare `string`, so a
  typo or unrecognized value is a type error going forward, not a silent
  fallback.
- Collapsed each `{buttonText && buttonStyle === "subtle" ? <A/> : <B/>}` to
  a single `<LinkButton {...mediaObjectLinkButtonFlags(buttonStyle)} />` —
  behavior-preserving: `buttonText` is a required (non-optional) prop on
  both components, so the `buttonText &&` guard could never actually
  prevent the button from rendering; it always fell into whichever variant
  the ternary's `else` produced.

### Files modified

- `components/Shared/actions/buttonStyles.ts` — `secondary` on `LinkButtonVariantFlags`/`resolveLinkButtonVariant()`.
- `components/Shared/actions/LinkButton.tsx` — `secondary` prop.
- `components/Shared/layout/mediaObjectButtonStyle.ts` — new.
- `components/Shared/layout/MediaObjectLeft.tsx`, `MediaObjectRight.tsx` — typed `buttonStyle`, use the shared mapping.
- `docs/notes/components/media-object.md`, `docs/notes/components/reusable-buttons.md` — documented.

### Verification

- `pnpm exec tsc --noEmit` — clean.
- `pnpm lint` — clean (same pre-existing unrelated warnings as before).
- `pnpm vitest run components/Shared/actions/GeneralButton.test.tsx` — 6 tests passed.

### Follow-up: cover every LinkButton flag, not just the ones asked for

The first pass above only added `"default" | "subtle" | "secondary"` to
`MediaObjectButtonStyle` — just enough to fix the reported bug. Asked why it
wasn't the full set: no good reason, so widened it to all seven `LinkButton`
flags (`"default" | "basic" | "secondary" | "subtle" | "warning" | "active"
| "disabled"`) via a `Record<MediaObjectButtonStyle, keyof
LinkButtonVariantFlags>` lookup table in `mediaObjectButtonStyle.ts`, so a
future MediaObject usage can reach any LinkButton look without this file
needing another matching addition. `mediaObjectLinkButtonFlags()` now
defaults an omitted `buttonStyle` to `"default"` via `?? "default"` rather
than an unconditional final `return`. Re-verified: `tsc`/`lint`/tests all
still clean.

### Follow-up 2: derive `MediaObjectButtonStyle` instead of retyping it

The widened union (above) was still hand-typed as its own literal list —
duplicating `LinkButtonVariantFlags`'s keys in a second place, exactly the
kind of drift this file exists to prevent. Asked why: no good reason there
either. Changed it to `Exclude<keyof LinkButtonVariantFlags,
"defaultStyle"> | "default"` — derived from `LinkButtonVariantFlags` itself
with only the one deliberate rename (`defaultStyle` → the friendlier
`default`) spelled out. `MEDIA_OBJECT_BUTTON_STYLE_FLAG`'s
`Record<MediaObjectButtonStyle, LinkButtonFlagName>` type still requires
every key to be mapped, so a future LinkButton flag now surfaces here as a
type error to resolve rather than silently missing. `pnpm exec tsc --noEmit` — clean.

### Follow-up 3: drop the `"default"` rename, use `defaultStyle` as-is

Asked whether the `default` → `defaultStyle` rename (and the lookup table it
required) was actually necessary — it wasn't. Simplified
`MediaObjectButtonStyle` to `keyof LinkButtonVariantFlags` directly (no
`Exclude`, no rename) and `mediaObjectLinkButtonFlags()` to a one-line
`{ [buttonStyle]: true }` passthrough with `buttonStyle = "defaultStyle"` as
the default parameter — the lookup table is gone entirely, since an
identity mapping doesn't need one. Updated the one live call site
(`app/page.tsx`) from `buttonStyle="default"` to `buttonStyle="defaultStyle"`
to match. `pnpm exec tsc --noEmit` / `pnpm lint` — clean.

## 2026-08-22 — Bugfix: `subtle` button hover rendering grey/white, not blue

### What was broken and why

User-reported (screenshot of the "Find Names" link on the landing page,
`buttonStyle="subtle"` in `MediaObjectLeft`): the `subtle` variant's hover
state rendered as a grey fill with a near-white border instead of blue.

Root cause: [tailwind.config.js](tailwind.config.js)'s `theme.extend.colors`
already had an (otherwise-unused, shadcn-scaffold) `accent` token —
`accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" }`
— and the `accent: "oklch(62% 0.16 264 / <alpha-value>)"` token added
earlier today for the button palette used the **same key name**, placed
_earlier_ in the same object literal. JS object literals silently let a
later duplicate key win, so the pre-existing shadcn `accent` object
overwrote mine — every `bg-accent`/`border-accent`/`hover:border-accent`
class actually compiled to `hsl(var(--accent))`, and
[`styles/globals.css`](styles/globals.css) defines `--accent: 0 0% 96.1%`
(a near-white gray) — exactly what showed up in the screenshot. No lint,
type, or test error catches a duplicate key in a plain JS object, so this
went unnoticed despite `GeneralButton.test.tsx`, `pnpm lint`, and
`pnpm exec tsc --noEmit` all passing clean at the time.

### Fix

Renamed the button-system token from `accent` to `buttonAccent`
(tailwind.config.js) and updated its 5 usages in
[`buttonStyles.ts`](components/Shared/actions/buttonStyles.ts)
(`secondary`, `tertiary`, `subtle` ×2, `active`). Left the pre-existing
shadcn `accent`/`accent-foreground` token alone — confirmed via grep it's
not used anywhere else in the codebase, so untouched rather than risking a
change to unrelated (if currently dead) scaffold code. Added a comment at
both the token definition and the variant map warning against renaming it
back to `accent` without removing the colliding shadcn token first.

### Verification

- Rebuilt (`pnpm build`) and inspected the compiled CSS directly: `hover:bg-buttonAccent/40` now compiles to `background-color:oklch(62% .16 264/.4)` and `hover:border-buttonAccent` to `border-color:oklch(62% .16 264/var(--tw-border-opacity,1))` — both genuinely blue, confirming the fix (previously these compiled to `hsl(var(--accent) / ...)`).
- `pnpm vitest run components/Shared/actions/GeneralButton.test.tsx` — 6 tests passed.
- The build's "Collecting page data" step hit the same pre-existing, unrelated `PageNotFoundError: Cannot find module for page: /_document` documented in an earlier entry (stale/interrupted build artifact) — CSS/type/lint stages all completed successfully before that; `rm -rf .next` was run again after to clear it.

### Files modified

- `tailwind.config.js` — `accent` → `buttonAccent`.
- `components/Shared/actions/buttonStyles.ts` — updated the 5 `accent`-class usages; comments explaining the collision.
- `docs/notes/components/reusable-buttons.md` — token list + collision note.

## 2026-08-22 — Unify GeneralButton + LinkButton styling into buttonStyles.ts

### What was changed

`LinkButton.tsx` styled itself independently of `GeneralButton.tsx` and had
drifted onto the old ad-hoc Tailwind colors (`yellow-200`/`yellow-600`,
`blue-500`/`blue-700`, `red-900`, `indigo-600`, `slate-300`, `gray-400`/
`gray-500`) that `GeneralButton` moved away from earlier today. Rather than
just recoloring `LinkButton` a second time, extracted the shared logic into
a new [`components/Shared/actions/buttonStyles.ts`](components/Shared/actions/buttonStyles.ts):
`BUTTON_BASE_CLASSES`/`HERO_BUTTON_BASE_CLASSES`, a `BUTTON_VARIANT_CLASSES`
color/class map, and a `resolve*Variant()` helper per component that
reproduces each component's own flag-precedence order (flags are checked in
a fixed sequence; a later true flag overrides an earlier one — preserved
exactly from the original if-chains so combined-flag behavior doesn't
silently change). Both components now just resolve a variant and look its
classes up in the shared map, so a future color/variant change only has to
happen in one place.

`LinkButton`'s variants now map onto the same tokens as `GeneralButton`:
`defaultStyle` → the same CTA look as `GeneralButton`'s default (was
ad-hoc yellow), `subtle`/`warning`/`active`/`disabled` → the matching
shared variant (`warning`/`active`/`disabled` were unused in production, so
zero visual-regression risk), `basic` → a new `basicLink` entry in the
shared map (its underline nav-link look was already token-only, so this
just centralizes it — no visual change). Deliberately **not** changed:
`LinkButton` still renders with zero variant classes when no flag is set
(`GeneralButton` always applies a default look) — real call sites
(`NavLayoutwithSettingsMenu.tsx`'s logo link, `SharingOptionsBar.tsx`,
`ReturnToPreviousPage.tsx`) depend on that to stay fully custom-styled via
their own `className`. Prop names also weren't unified across the two
components — the flag sets don't actually overlap enough to unify cleanly
(no `secondary`/`tertiary`/`plain` equivalent on `LinkButton`; no
`basic`/`defaultStyle` equivalent on `GeneralButton`).

Also adopted `cn()` (clsx + tailwind-merge, already in
[lib/utils.ts](lib/utils.ts) but previously used by only one component,
`skeleton.tsx`) in both components to compose `baseClasses`/variant
classes/`className`, replacing raw template-literal concatenation. This
fixes the exact fragility called out in the `heroStyle` entry below
("conflicting Tailwind utilities' precedence depends on generated-CSS
source order, not template order") for real this time, instead of just
working around it — e.g. `LinkButton`'s `basic` variant sets `rounded-none`
to override the shared base's `rounded-2xl`; `twMerge` resolves that
correctly regardless of source order, where string concatenation only
worked by accident.

Also dropped `classForDiv` from `LinkButtonProps` — declared but never
read anywhere in the codebase.

### Files modified

- `components/Shared/actions/buttonStyles.ts` — new; shared base classes, `BUTTON_VARIANT_CLASSES` map, `resolveGeneralButtonVariant()`, `resolveLinkButtonVariant()`.
- `components/Shared/actions/GeneralButton.tsx` — uses the shared resolver/map + `cn()`; no rendered-output change.
- `components/Shared/actions/LinkButton.tsx` — uses the shared resolver/map + `cn()`; recolored `defaultStyle`/`warning`/`active`/`disabled`/`basic` onto shared tokens; dropped `classForDiv`.
- `docs/notes/components/reusable-buttons.md` — new "Shared styling: buttonStyles.ts" section; updated `LinkButton` section (variant mapping, the no-flag/unstyled asymmetry, prop-name mismatch).

### Verification

- `pnpm vitest run components/Shared/actions/GeneralButton.test.tsx` — 6 tests passed, unmodified (still asserts literal `bg-red-800`/`bg-secondary`/`rounded-full`, confirming `cn()` didn't strip anything unexpected).
- `pnpm lint` — clean (only the same pre-existing unrelated warnings as before this change).
- `pnpm exec tsc --noEmit` — clean.

### Next logical step

`GeneralOpenCloseButton.tsx` / `iconOpenCloseButton.tsx` are a separately
copy-pasted tab-toggle pair still on old ad-hoc colors — a candidate for the
same treatment later, not part of this change.

## 2026-08-22 — GeneralButton: new design-system-aligned color palette

### What was changed

Replaced `GeneralButton`'s ad-hoc Tailwind color classes
(`yellow-300`/`yellow-700`, `blue-500`/`blue-700`, `indigo-600`,
`gray-400`/`gray-500`, `slate-300`) with a palette built from the existing
design-system tokens (`primary`, `secondary`, `subtleBackground`,
`subtleBorder`, `subtleWhite`) plus a small accent/outline/disabled set added
alongside them in [tailwind.config.js](tailwind.config.js): `accent`,
`accentFill`, `accentFillBorder`, `outlineBorder`, `warningHover`,
`disabledBg`, `disabledText`. Explored as a set of visual directions in a
design canvas first (current-state audit + 3 alternate color directions),
then iterated on the chosen "design-system aligned" direction based on
feedback: warning uses a conventional obvious red (`red-800` /
`warningHover`, not a muted brand-derived brown), `plain`'s hover fills the
background instead of only recoloring the text, `tertiary`'s hover keeps
white text (only the underline recolors), and `disabled` text was lightened
for legibility.

Every variant now also sets an explicit border **width** (`border-[1.5px]`,
`border-2` for `active`, `border-4` for `hero`, unchanged) — previously
most variants set a border _color_ class without a width utility, so the
border was invisible in practice (Tailwind's border-width defaults to 0).
Only `secondary` (`border-t border-x`) and `heroStyle` (`border-4`)
actually rendered a border before this change.

### Why these values (not eyeballed)

Every text/background pair was checked against WCAG AA (4.5:1 for button
text, 3:1 for a border that's a button's only affordance — `secondary`,
`tertiary`, `disabled`) using a small local script computing relative
luminance from oklch/hex values, not by eye. Several combinations tried
during exploration failed and were swapped for a passing one before landing
in the component — see [docs/notes/components/reusable-buttons.md](docs/notes/components/reusable-buttons.md#generalbutton)
for the final ratios per variant.

### Files modified

- `tailwind.config.js` — added `accent`, `accentFill`, `accentFillBorder`, `outlineBorder`, `warningHover`, `disabledBg`, `disabledText` color tokens.
- `components/Shared/actions/GeneralButton.tsx` — new `bgClass` per variant (default/secondary/tertiary/plain/subtle/warning/active/disabled/heroStyle), each with an explicit border width.
- `docs/notes/components/reusable-buttons.md` — documented the new palette, the border-width fix, and the WCAG pass.

### Verification

- `pnpm vitest run components/Shared/actions/GeneralButton.test.tsx` — 6 tests passed (no test changes needed; existing assertions on `bg-red-800`/`bg-secondary`/`rounded-full` still hold).

### Next logical step

Consider applying the same token set to `LinkButton.tsx`, which currently
has its own separate `defaultStyle`/`basic`/`subtle`/`warning`/`active`/
`disabled` variants using the old ad-hoc colors.

## 2026-08-22 — YoutubeEmbed: poster/facade pattern to fix blurry video thumbnails

### What was changed

The landing-page video panels ([components/ShowingListOfContent/YoutubeEmbed.tsx](components/ShowingListOfContent/YoutubeEmbed.tsx),
used by the "Impactful"/"Fun"/"Fitting" videos wired through
[components/LandingPage/HeroTop.tsx](components/LandingPage/HeroTop.tsx) →
[app/page.tsx](app/page.tsx)) showed an extremely blurry pre-play thumbnail. `YoutubeEmbed`
previously mounted the real `youtube-nocookie.com` `<iframe>` as soon as the panel opened, just
visually hidden behind a spinner until the iframe's own `onLoad` fired — so the thumbnail shown
before playback was always whatever low-resolution image YouTube itself generated for that
video, which we have no control over (no embed URL parameter exists to request a sharper one).

Switched to the standard "facade"/"lite-youtube" pattern: `YoutubeEmbed` now renders a static
poster image (new `posterSrc`/`posterAlt` props) with a play-button overlay (`Play` icon from
`lucide-react`, already a dependency) first, and only mounts the real iframe — with
`?autoplay=1` — once the user clicks it. If the local poster file hasn't been supplied yet (all
three are placeholders pending real screenshots), an `onError` handler on the `next/image`
falls back to YouTube's own `hqdefault.jpg` thumbnail so nothing breaks in the meantime. This
is also a perf win: the iframe (and its network request) no longer loads until the user
actually presses play, not just when the panel opens.

### Files modified

- `components/ShowingListOfContent/YoutubeEmbed.tsx` — `posterSrc`/`posterAlt` props, `started`/`posterFailed` state, poster/play-button facade before the iframe, `autoplay=1` + `allow="autoplay; web-share"` once started, close button no longer gated on `loaded`.
- `app/page.tsx` — added `posterSrc`/`posterAlt` to all three `YoutubeEmbed` call sites (`/impactful-poster.jpg`, `/fun-poster.jpg`, `/fitting-poster.jpg` — files to be supplied separately).
- `docs/notes/components/showing-list-of-content/youtube-and-social-lists.md` — updated prop table and behavior notes for the facade pattern.

### Problems encountered

None with this change directly. Unrelated: mid-session the file briefly ended up with a
malformed JSX-in-template-literal heading and a stale `.next` build cache
(`PageNotFoundError: Cannot find module for page: /_document`) from an earlier interrupted
build — both were pre-existing/environmental, not caused by this change; the heading was fixed
separately and `rm -rf .next` resolved the stale cache.

### Verification

- `pnpm lint` — clean (only pre-existing unrelated warnings in other files).
- `pnpm build` — succeeded after clearing `.next`.

### TODO

- Supply the actual poster screenshots at `public/impactful-poster.jpg`, `public/fun-poster.jpg`,
  `public/fitting-poster.jpg` (an existing unused `public/impactfulThumbnail.png` is already a
  sharp Fishtopher/"Impactful" screenshot, though fresh images are planned for all three).

## 2026-08-22 — Add `heroStyle` variant to GeneralButton; migrate HeroTop buttons

### What was changed

Added a `heroStyle` boolean flag to
[components/Shared/actions/GeneralButton.tsx](components/Shared/actions/GeneralButton.tsx)
and migrated the three landing-page hero buttons ("Fun", "Impactful",
"Fitting") in
[components/LandingPage/HeroTop.tsx](components/LandingPage/HeroTop.tsx)
from raw hand-written `<button>` elements to `<GeneralButton heroStyle />`,
so future style edits to this button style sync from one place. This also
fixed an existing inconsistency: "Fun" and "Fitting" used
`border-b-4 border-subtleWhite` while "Impactful" used
`border-4 border-subtleBorder` — all three are now standardized on the
"Impactful" look. "Fitting" also had an extra `px-0` utility the other two
lacked; dropped it as part of standardizing all three on one identical
style.

### Problems encountered / options considered

`GeneralButton`'s `baseClasses` (`font-bold my-3 py-1 px-4 rounded-2xl
text-base`) is unconditionally applied and conflicts with the new variant's
required shape (`rounded-full`, `h-10`, `text-sm`, `w-full`, `mt-2` vs.
`rounded-2xl`, `py-1`, `text-base`). Plain string concatenation makes
conflicting Tailwind utilities' precedence depend on generated-CSS source
order, not the order classes appear in the template literal — too fragile
for a variant needing a different base shape rather than just a color swap.

Two options considered: (a) adopt the existing `cn()`/`twMerge` helper
([lib/utils.ts](lib/utils.ts), already a dependency but unused by
`GeneralButton`) throughout the component for principled last-wins conflict
resolution, or (b) give `heroStyle` its own fully self-contained
`baseClasses`/`bgClass` override that bypasses the default `baseClasses`
entirely. Chose (b): `GeneralButton` is imported by ~24 other files, and
(a) would have changed class-conflict resolution behavior for all of them
to fix a problem only the new variant has. `let baseClasses` (was `const`)
was needed to support the override.

### Also updated

- [components/Shared/actions/GeneralButton.test.tsx](components/Shared/actions/GeneralButton.test.tsx) — added a `heroStyle` variant test, matching the existing per-variant pattern.
- [docs/notes/components/reusable-buttons.md](docs/notes/components/reusable-buttons.md) — documented `heroStyle` as a standalone flag not designed to combine with the others.

## 2026-08-21 — Refactor pagination selects to remove invisible-overlay/duplicated-state hack

### What was changed

Follow-up to the "Fix unresponsive ... dropdown pills" entry below. That
fix (invisible `absolute inset-0 opacity-0` `<select>` + a separate
`pointer-events-none` span/icon layer showing the "real" text) worked,
but introduced a maintenance smell: the visible label text for the sort
control was a hand-written ternary chain
(`sortingProperty === "likedByCount" && sortingValue === -1 ? "Most
Liked" : ...`) that had to be kept in sync by hand with the `<option>`
list a few lines above — two sources of truth for the same information,
with no compiler check tying them together.

Replaced both selects in
[components/ShowingListOfContent/pagination.tsx](components/ShowingListOfContent/pagination.tsx)
with the standard custom-select pattern: the `<select>` itself **is**
the entire visible pill (background/border/radius/padding moved directly
onto it), so the browser renders the real selected `<option>`'s text —
no decoy span, no invisible layer, single source of truth. The decorative
chevron is now a CSS `background-image` (`CHEVRON_DOWN_BG`, an inline
SVG data URI reproducing lucide's chevron-down glyph) instead of a
`<ChevronDown>` React node — a background-image structurally can't
intercept clicks, so no `pointer-events-none` bookkeeping is needed at
all. The `ChevronDown` import was removed as a result (still used
elsewhere in the file for the prev/next arrow buttons via
`ChevronLeft`/`ChevronRight`, which are unaffected).

For the per-page control, the "per page" caption (previously separate
decorative text) was folded directly into each `<option>`'s label (e.g.
`"10 per page"`) since a real `<select>` can only render its own option
text — there's no way to show extra static text alongside it without
reintroducing an overlay.

### Why this fix

This is the standard, well-tested pattern for a custom-styled native
`<select>` (used by e.g. Tailwind's `forms` plugin) — the real control's
box **is** the whole visible area, so there's inherently nothing to
desync and no overlay trick required. Simpler DOM, less code, and
removes the drift risk from the previous fix's hand-maintained ternary.

## 2026-08-21 — Fix unresponsive "per page" / "sort by" dropdown pills

### What was changed

In [components/ShowingListOfContent/pagination.tsx](components/ShowingListOfContent/pagination.tsx),
the "per page" and "sort by" controls are each styled as one pill
(background, border, rounded corners) containing a `<select>`, a text
label, and a `ChevronDown` icon. The pill's visible bounds only wrapped
the `<select>` itself for hit-testing — clicking the chevron icon, the
"per page"/label text, or the surrounding padding did nothing, since
those were separate sibling elements outside the actual `<select>`'s
hit area. Only clicking directly on the current value text (e.g. the
number "10") opened the native picker.

Fixed by making the `<select>` itself the full clickable surface: it's
now `absolute inset-0` (invisible, `opacity-0`) inside a `relative` pill
container, sized to cover the entire pill including the chevron and
padding. The pill's visible content (current value text, "per page"
label, chevron) is rendered as a separate `pointer-events-none` layer on
top of it purely for display, so every click anywhere in the pill lands
on the select underneath and opens the native picker.

### Problem encountered

Two false starts before landing on this:

1. Initially assumed a Firefox-specific `appearance-none`/sizing CSS bug
   (the user first said "the dropdown doesn't respond" while testing in
   Firefox). Static code reading couldn't confirm this, and the user
   then pinpointed the real cause via devtools: the chevron/label text
   were never wired to the select's hit-box, in any browser.
2. Tried wrapping the whole pill in a `<label htmlFor="...">` instead of
   a plain `<section>`, assuming clicking a label associated with a
   `<select>` would open its picker like it does for radio/checkbox/text
   inputs. It doesn't — in Chrome/Firefox a label click on a `<select>`
   only focuses it, it does not open the dropdown. The user reported
   clicking still did nothing, which ruled this out.

### Why this fix

Stretching the actual `<select>` over the whole pill (rather than
relying on `<label>` association) is the standard "invisible native
control on top, styled decoration underneath" pattern for making an
entire custom-styled area trigger a native form control's real
interaction — it doesn't depend on browser-specific label-forwarding
behavior. Kept the visible current-value text as its own span (driven
from the same `itemsPerPage`/`sortingProperty`/`sortingValue` state) so
the display doesn't rely on the now-invisible select's own rendered
text. `page.locator("select")` e2e selectors are unaffected since the
selects remain in the same DOM order.

## 2026-08-21 — Fix pagination "Items" label regression

### What was changed

Restored the literal word "Items" in the pagination range label in
[components/ShowingListOfContent/pagination.tsx](components/ShowingListOfContent/pagination.tsx)
(`"{start}-{end} of {totalItems} Items"`).

### Problem encountered

The `f171b55` "refactor: improve layout and structure of pagination and
content listing components" commit dropped the trailing " Items" from the
label text. This broke 6 e2e specs that assert on
`getByText(/\d+-\d+ of \d+ Items/)`:
`fetchdescriptions-cooldown.spec.ts` (3 tests) and
`fetchnames-cooldown.spec.ts` (3 tests) — all timed out waiting for that
text on page load, since `gotoFetchdescriptions`/`gotoFetchnames` use it as
their initial-load ready signal.

### Why this fix

Restoring the word is a one-line, behavior-preserving fix that matches what
the e2e suite (and presumably the intended UI copy) expects, rather than
rewriting the tests to match the unintentional wording change.

### Also fixed: stale selector in fetchname.spec.ts

`e2e/fetchname.spec.ts:16` ("finds duplicate for seeded name") looked for
`span.font-bold.text-center` containing the seeded name. The `text-center`
class was intentionally removed from that element (it's a
`<p className="font-bold ...">`, not a `span`, per current
[ContentListing.tsx](components/ShowingListOfContent/ContentListing.tsx)
markup), so the test — not the component — was out of date. Updated the
locator to `p.font-bold`.

## 2026-06-02 — TypeScript migration wave 1

### What was built and why

Incremental TypeScript conversion (wave 1): small leaf utilities and hooks with minimal dependencies, following the migration plan. Keeps `strict: false` until most of the codebase is converted.

### Files created

- `utils/fetch.ts`
- `utils/error.ts`
- `utils/stringManipulation/normalizeString.ts`
- `utils/api/checkIfValidContentType.ts` (exports `ContentType` union co-located)
- `utils/debounce.ts` (generic debounce with `cancel` / `flush`)
- `hooks/usePrefersReducedMotions.ts`
- `hooks/useApiRateLimiter.ts`
- `CHANGES.md`

### Files modified

- `tsconfig.json` — added `noFallthroughCasesInSwitch` and `noImplicitReturns`; kept `strict: false` and `strictNullChecks: true`

### tsconfig.json choices (and why)

This project is ~95% JavaScript, so tsconfig is tuned for **incremental migration**, not full strictness on day one.

**Left unchanged on purpose**

| Option                            | Value       | Why                                                                                                                                                                                                                                |
| --------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allowJs`                         | `true`      | Most files are still `.js`/`.jsx`. Without this, TypeScript would ignore the majority of the codebase and break the gradual rename-and-type workflow.                                                                              |
| `strict`                          | `false`     | Enabling full strict mode now would surface hundreds of errors across untouched JS files and force a big-bang fix. We flip this to `true` later, once ~70%+ of files are converted.                                                |
| `strictNullChecks`                | `true`      | Already on before wave 1. Null/undefined bugs are high-value to catch early, and the existing TS files (email templates, hooks) were written with this in mind. Keeping it avoids regressing code that already passes null checks. |
| `include` (`**/*.js`, `**/*.jsx`) | kept        | Same reason as `allowJs` — JS and TS coexist in one project until migration is done.                                                                                                                                               |
| `moduleResolution`                | `"node"`    | Works with the current Next.js 15 setup. `"bundler"` is a later option when we enable full strict and tighten the toolchain.                                                                                                       |
| `checkJs`                         | not enabled | Would type-check every JS file immediately and create a huge error surface before those files have types. Optional `// @ts-check` per file is the safer path for hard modules later.                                               |

**Added in wave 1**

| Option                       | Why                                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `noFallthroughCasesInSwitch` | Catches accidental `switch` fall-through — a real logic bug — without requiring types on any file. Safe to turn on during migration.                                 |
| `noImplicitReturns`          | Ensures functions with a return type (or inferred return paths) actually return on all code paths. Again, catches bugs without forcing `noImplicitAny` on legacy JS. |

**Deliberately deferred**

- **`strict: true`** — replaces individual strict flags; wait until most files are `.ts` so the error list is manageable.
- **`moduleResolution: "bundler"`** — Next 15 recommendation, but not required while `strict` stays off.
- **`checkJs: true`** — only worth considering file-by-file before rename, not globally.
- **typescript-eslint** — add when enough `.ts` files exist to justify type-aware linting.

In short: keep the door open for JS, enforce null safety on code we already type, add two low-risk bug-catching flags, and save full strict mode for when the conversion is far enough along.

### Files removed

- `utils/fetch.js`
- `utils/error.js`
- `utils/stringManipulation/normalizeString.js`
- `utils/api/checkIfValidContentType.js`
- `utils/debounce.js`
- `hooks/usePrefersReducedMotions.js`
- `hooks/useApiRateLimiter.js`

### Patterns followed

- Co-located types (`ContentType`, hook props interfaces) matching existing TS in `hooks/use-copy-to-clipboard.ts` and `lib/utils.ts`
- `unknown` narrowing in `getError` instead of `any`
- Generic `debounce<T>` for reuse by `useToggleState.js`
- Path aliases unchanged; extensionless imports still work for consumers

### Problems encountered

- None. `pnpm build` completed successfully (exit 0).

### TODOs (deferred by design)

- **`types/` folder:** Not created yet — `ContentType` is co-located in `checkIfValidContentType.ts` until a second consumer needs it. Same for `ActionResult<T>`.
- **`strict: true` / typescript-eslint:** Deferred until ~70% of files are converted, per migration plan.

### Next logical step

Wave 2: remaining `utils/api/*`, `utils/db.js`, then smallest Mongoose models (`NameTag.js`, `NameCategory.js`).

---

## 2026-06-03 — Testing setup (Jest + RTL + Playwright)

### What was built and why

Added Jest, React Testing Library, and Playwright during the TS migration. Jest chosen over Vitest for maturity and existing-codebase applicability.

### Install note

First `pnpm add` failed (`exit 1`) because pnpm `minimumReleaseAge` blocked pinned `@types/bcryptjs@2.4.6`. Retry with `--config.minimumReleaseAge=0` succeeded.

### Files created

- `jest.config.ts`, `jest.setup.ts`, `TESTING.md`
- `playwright.config.ts`, `e2e/login.spec.ts`
- Unit tests: `utils/error.test.ts`, `utils/debounce.test.ts`, `utils/stringManipulation/normalizeString.test.ts`, `utils/api/checkIfValidContentType.test.ts`
- Component test: `components/Shared/ui/skeleton.test.tsx`

### Files modified

- `package.json` — test scripts and devDependencies
- `jest.config.ts` — exclude `migrations/` (avoids picking up `migrations/test.js` as a test)

### Verification

- `pnpm test` — 5 suites, 12 tests passed (~9s)
- E2E: run `pnpm exec playwright install` once, then `pnpm test:e2e` (requires build + start; slow first run)

---

## 2026-06-03 — TypeScript migration wave 2 + tests

### What was built and why

Converted remaining small `utils/api` helpers, leaf utils, and the two smallest Mongoose models. Added Jest tests for `bannedWordsMessage` and `detectBotPatterns` per convert-then-test workflow.

### Files created

- `utils/api/cloudinary.ts`, `bannedWordsMessage.ts`, `getSessionForApis.ts`, `detectBotPatterns.ts`, `checkMultipleBlocklists.ts`
- `utils/chooseRandomDefaultAvatar.ts`, `utils/stringManipulation/convertStringToMongooseId.ts`
- `models/NameTag.ts`, `models/NameCategory.ts`
- `utils/api/bannedWordsMessage.test.ts`, `utils/api/detectBotPatterns.test.ts`

### Files modified

- `models/User.js` — extensionless import for `chooseRandomDefaultAvatar`
- `utils/api/getSessionForApis.ts` — returns `response: Response` (401) when unauthenticated (fixes routes that did `if (!ok) return response`)

### Files removed

- Wave 2 `.js` counterparts listed above (plus duplicate wave 1 `.js` where still present)

### Verification

- `pnpm test` — 7 suites, 20 tests passed
- `pnpm build` — succeeded after `checkMultipleBlocklists` and `getSessionForApis` type fixes

### Next logical step

Wave 2 continued: `utils/db.js`, `rateLimiter.js`, `checkIfAdmin.js`, `checkOwnership.js`; then `DescriptionTag` / `DescriptionCategory` models.

---

## Contact spam validation fix (2026-06-02)

### What was built and why

The contact form called `hasRealisticContent(name, message)` but the function only accepted one argument, so **only the name was validated** and gibberish messages slipped through. Split validation into field-specific rules and validate both name and message in the server action.

### Files modified

- `utils/api/detectBotPatterns.ts` — `hasRealisticName`, `hasRealisticMessage`, `hasRealisticContactFields`; shared `hasLongSingleGibberishToken` helper; `hasRealisticContent` kept as alias to `hasRealisticMessage`
- `utils/api/detectBotPatterns.test.ts` — spam example strings + legitimate name/message cases
- `app/actions/sendContactEmail.js` — `hasRealisticContactFields(name, message)`; `detectBotPatterns` on name and message

### Problems and fixes

- **Bug:** Second argument to `hasRealisticContent` was ignored at runtime.
- **Fix:** Explicit two-field API; name allows 1–2 words without 3-word minimum; message keeps 3+ words and avg length cap.

### Verification

- `pnpm test` — 7 suites, 27 tests passed
- `pnpm build` — succeeded

### TODOs

- None for this fix.

### Next logical step

Continue TS wave 2 (`utils/db.js`, remaining `utils/api/*`).

---

## Contact name validation tweak (2026-06-02)

### What was built and why

Name field no longer uses message-style heuristics (avg word length, 15-char single token). Long legitimate surnames are allowed; gibberish contact names are caught via `detectBotPatterns` (`^[A-Za-z]{19,}$` — sample spam name is 19 chars, so 20+ would not match).

### Files modified

- `utils/api/detectBotPatterns.ts` — `hasRealisticName` is non-empty only; added `^[A-Za-z]{20,}$` pattern
- `utils/api/detectBotPatterns.test.ts` — spam caught by `detectBotPatterns`; `Wojciechowski` allowed

### Verification

- `pnpm test` — 7 suites, 27 tests passed

---

## detectBotPatterns scoring refactor fix (2026-06-02)

### What was built and why

Scoring threshold (≥3) left the 19+ letter gibberish rule at score 2, so contact spam no longer reached the threshold. Raised gibberish rule to score 3. Removed CJK/Cyrillic rules (legitimate non-English messages). Added tests for lone URL and Chinese text.

### Files modified

- `utils/api/detectBotPatterns.ts`
- `utils/api/detectBotPatterns.test.ts`

### Verification

- `pnpm test` — detectBotPatterns suite, 14 tests passed

---

## TypeScript migration wave 2 continued (2026-06-02)

### What was built and why

Continued incremental TS conversion for high-traffic API utilities, DB connect helper, and description models. Added tests for `rateLimiter` (contact form dependency). Fixed `checkOwnership` to avoid reading `session.user` when unauthenticated.

### Files created

- `utils/api/rateLimiter.ts`, `utils/api/rateLimiter.test.ts`
- `utils/api/checkIfAdmin.ts`, `utils/api/checkOwnership.ts`
- `utils/api/getPaginatedNotifications.ts`
- `utils/db.ts`
- `models/DescriptionTag.ts`, `models/DescriptionCategory.ts`

### Files removed

- `utils/api/rateLimiter.js`, `checkIfAdmin.js`, `checkOwnership.js`, `getPaginatedNotifications.js`
- `utils/db.js`
- `models/DescriptionTag.js`, `models/DescriptionCategory.js`

### Files modified

- `app/api/names/swr/route.js` — `@utils/db.js` → `@utils/db`

### Problems and fixes

- **Build:** `mongoose.connect` deprecated options removed (`useNewUrlParser` / `useUnifiedTopology` not in Mongoose 6 types).
- **Build:** NextAuth default `User` type lacks `role`/`status` — narrow with `AppUser` cast in admin/ownership checks.
- **Bug:** `checkOwnership` used `session.user` before verifying `getSessionForApis` ok.

### Verification

- `pnpm test` — 8 suites, 34 tests passed
- `pnpm build` — succeeded

### TODOs

- `utils/api/migrateField.js` (migrations only)
- Larger models: `User`, `Name`, `Description`, etc.
- Optional: `next-auth` module augmentation for `role` / `status` on `Session.user`

### Next logical step

Convert `mongoDataCleanup.js` or start `lib/auth.js` with tests; expand `next-auth` types when touching auth.

---

## 2026-06-02 — Vercel / pnpm install fix (first production pnpm deploy)

### What was broken and why

pnpm had **never** completed a successful install on Vercel for this repo. Production builds failed at `pnpm install` (exit 1), not at `next build`.

Root cause: **`package.json` and `pnpm-lock.yaml` disagreed on pnpm config.**

- `package.json` declared `pnpm.overrides` pinning `prettier` to `2.8.4` and `@types/bcryptjs` to `2.4.6`.
- `pnpm-lock.yaml` had **no** matching `settings.overrides` (lockfile was generated without those overrides).
- Lockfile importers used caret specifiers (e.g. `prettier: ^2.8.4` → resolved `2.8.8`).

Vercel reported `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` because pnpm requires lockfile `settings` to match `package.json` `pnpm` fields exactly.

Contributing cleanup from the same migration window:

- Stray `package-lock.json` (npm) could confuse tooling — removed in `8ea3dfa`.
- Empty `pnpm-workspace.yaml` (not a monorepo) — removed in `b3879ed`.

### How we fixed it

1. **Removed `pnpm.overrides`** from `package.json` so devDependencies use normal caret ranges (`^2.8.4`, `^2.4.6`) aligned with the lockfile.
2. **Synced `pnpm-lock.yaml`** — no `settings.overrides`; importers match `package.json` specifiers.
3. **Pinned package manager** — added `packageManager: pnpm@9.15.9` so Vercel uses the same pnpm major as CI/local frozen installs (not pnpm 11 from a global install).
4. **Added `pnpm.onlyBuiltDependencies`** for `core-js`, `esbuild`, `sharp`, `unrs-resolver` so native/postinstall scripts are allowed under pnpm’s build-script policy.

### Files modified

- `package.json` — removed overrides; added `onlyBuiltDependencies` and `packageManager`
- `pnpm-lock.yaml` — aligned with `package.json` (no override settings)

### Verification

```bash
CI=true npx pnpm@9.15.9 install --frozen-lockfile
```

Commit: `2eee3cd` — `bug: pnpm mismatch build bug`

### TODOs

- Confirm first green Vercel deploy after push (install + `next build`).
- Do **not** re-add `pnpm.overrides` without regenerating the lockfile so `settings.overrides` matches.

### Next logical step

Push to `main`, watch Vercel install logs, then run `npx pnpm@9.15.9 build` locally if build was not verified in the same session.

---

## 2026-06-06 — TypeScript migration: `mongoDataCleanup`

### What was built and why

Converted `utils/mongoDataCleanup.js` to TypeScript — shared helper used across pages and API routes to run `.lean()` queries and stringify ObjectIds / strip `__v`. Added unit tests with mocked queries (no DB).

### Files created

- `utils/mongoDataCleanup.ts` — `leanWithStrings`, exported `MongoCleanupResult<T>` utility type
- `utils/mongoDataCleanup.test.ts` — 4 tests (null result, single doc, array, nested ObjectIds + Date)

### Files removed

- `utils/mongoDataCleanup.js`

### Files modified

- `jest.setup.ts` — `TextEncoder` / `TextDecoder` polyfill (required when Jest loads mongoose/mongodb)

### Patterns followed

- Same recursive transform logic as the JS original; `LeanQuery` union accepts real Mongoose queries and test mocks
- Extensionless imports unchanged (`@/utils/mongoDataCleanup`, `../mongoDataCleanup`)

### Problems and fixes

- **Jest:** Importing mongoose triggered `TextEncoder is not defined` — fixed via `util` polyfill in `jest.setup.ts`
- **Build:** Mongoose `lean().exec()` return type did not align with `MongoCleanupResult<TReturn>` — explicit casts on return paths (pragmatic, same as other migration files)

### Verification

- `pnpm test` — 9 suites, 38 tests passed
- `pnpm build` — succeeded

### TODOs

- Larger models still JS: `User`, `Name`, `Description`, etc.
- `utils/api/migrateField.js` (migrations only)
- Optional: `next-auth` module augmentation for `role` / `status`

### Next logical step

Convert `lib/auth.js` with tests and expand NextAuth session types when touching auth.

### Follow-up (inline comments)

Added comments in `mongoDataCleanup.ts`, `mongoDataCleanup.test.ts`, and `jest.setup.ts` explaining lean/exec flow, transform rules, test mocks, and the TextEncoder polyfill. Test file uses `@jest-environment node` to avoid mongoose/jsdom warnings.

### Follow-up (manual test checklist)

Added **Manual verification (TypeScript migration)** section to `TESTING.md` — copy-paste checklist for post-migration smoke testing in the running app.

---

## 2026-06-06 — Extract code notes to `docs/notes/`

### What was built and why

Moved heavy learning/design comments out of source files into central markdown so `utils/` stays clean. Each source file keeps a one-line pointer at the top.

### Files created

- `docs/README.md` — conventions and index
- `docs/notes/utils/mongoDataCleanup.md` — design notes from `mongoDataCleanup.ts`
- `docs/notes/jest-setup.md` — TextEncoder polyfill notes from `jest.setup.ts`

### Files modified

- `utils/mongoDataCleanup.ts` — trimmed to slim JSDoc + pointer to notes
- `jest.setup.ts` — trimmed + pointer to notes
- `TESTING.md` — link to `docs/notes/` under "Where tests live"

### Next logical step

Use the same pattern for future TS conversions (`lib/auth.js`, etc.): notes in `docs/notes/<path>/<module>.md`, pointer in source.

---

## 2026-06-06 — TypeScript migration: `lib/auth`

### What was built and why

Converted `lib/auth.js` to TypeScript with NextAuth module augmentation. Extracted `resolveSignInCallback` for unit tests. Moved all original inline comments to `docs/notes/lib/auth.md` (not deleted).

### Files created

- `lib/auth.ts` — `serverAuthOptions`, `toCredentialsUser` / `toTokenUser`
- `lib/resolveSignInCallback.ts` — pure signIn branching (re-exported from `auth.ts`)
- `lib/resolveSignInCallback.test.ts` — 4 tests for sign-in branching
- `types/next-auth.d.ts` — `Session.user`, `User`, `JWT` augmentation (`id`, `role`, `status`, profile fields)
- `docs/notes/lib/auth.md` — full notes from original `auth.js`

### Files removed

- `lib/auth.js`

### Files modified

- `utils/api/checkIfAdmin.ts`, `checkOwnership.ts` — removed `AppUser` casts (types from augmentation)
- `utils/api/getSessionForApis.ts` — removed `AuthOptions` cast
- `docs/README.md` — index entry for auth notes

### Verification

- `pnpm test` — includes `lib/resolveSignInCallback.test.ts`
- `pnpm build` — succeeded
- Manual: login (credentials + magic link), protected routes, admin guard

### Next logical step

Medium utils still JS: `getUserByProfileName.js`, `findNormalizedMatch.js`, `startCooldown.js`, `filevalidation.js`.

---

## 2026-06-06 — Type `User` model; tighten `lib/auth` types

### What was built and why

Replaced loose `as string` casts in `lib/auth.ts` by converting `models/User.js` → `User.ts` with `UserStatus`, `UserRole`, and `IUserDocument`. NextAuth augmentation now uses those unions.

### Files created

- `models/User.ts`

### Files removed

- `models/User.js`

### Files modified

- `lib/auth.ts` — `toCredentialsUser` / `toTokenUser` helpers; no field casts
- `types/next-auth.d.ts` — `role` / `status` use `UserRole` / `UserStatus`

### Verification

- `pnpm exec tsc --noEmit` — clean
- `pnpm test` / `pnpm build` — run before merge

---

## 2026-06-06 — Auth docs / CHANGES housekeeping

### What was changed and why

Corrected stale references after auth TS migration: test file is `lib/resolveSignInCallback.test.ts`; JWT/credentials notes now describe `toTokenUser` / `toCredentialsUser` and required `user.id`.

### Files modified

- `CHANGES.md` — auth entry test file names
- `docs/notes/lib/auth.md` — JWT, credentials, related files sections synced with [`lib/auth.ts`](lib/auth.ts)

---

## 2026-06-07 — TypeScript migration wave 3 (utils batch)

### What was built and why

Converted the next three medium leaf utils from CHANGES “wave 3” plan: profile lookup, pagination cooldown timer, and normalized content duplicate queries. Added tests for `findNormalizedMatch` and `startCooldown`; moved long regex/index notes to `docs/notes/`.

### Files created

- `utils/getUserByProfileName.ts`
- `utils/startCooldown.ts`
- `utils/stringManipulation/findNormalizedMatch.ts`
- `utils/stringManipulation/findNormalizedMatch.test.ts`
- `utils/startCooldown.test.ts`
- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

### Files removed

- `utils/getUserByProfileName.js`
- `utils/startCooldown.js`
- `utils/stringManipulation/findNormalizedMatch.js`

### Files modified

- `docs/README.md` — index entry for findNormalizedMatch notes

### Patterns followed

- `Model<T extends NormalizedContentFields>` for Mongoose query helpers (same pragmatic cast style as `mongoDataCleanup.ts`)
- `IUserDocument | null` return on profile lookup (typed `User.ts` consumer)
- React `MutableRefObject` / `Dispatch<SetStateAction<number>>` for cooldown hook helper
- Extensionless imports unchanged for all consumers

### Problems and fixes

- **Build:** Mongoose `populate()` return type did not align with `T | null` — explicit casts on return paths (same as `mongoDataCleanup.ts`).

### Verification

- `pnpm test` — 12 suites, 48 tests passed
- `pnpm build` — succeeded

### TODOs

- `lib/checkBlocklist.js` — next util (already consumed by typed `checkMultipleBlocklists.ts`)
- `utils/filevalidation.js` — appears unused; convert or remove when touching uploads
- Small models: `NameLike`, `DescriptionLike`, `Follow`, etc.

### Next logical step

Convert `lib/checkBlocklist.js` with tests and `docs/notes/lib/checkBlocklist.md`.

---

## 2026-06-07 — findNormalizedMatch docs: code examples

### What was changed and why

Expanded `docs/notes/utils/stringManipulation/findNormalizedMatch.md` with implementation snippets from `findNormalizedMatch.ts` and real call-site examples from names/description API routes.

### Files modified

- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

### Next logical step

Convert `lib/checkBlocklist.js` with tests and `docs/notes/lib/checkBlocklist.md`.

---

## 2026-06-07 — findNormalizedMatch docs: overview at top

### What was changed and why

Moved “which function to use” and a route-level usage map to the top of `findNormalizedMatch.md` so readers get context (submit vs live check vs substring) before implementation detail.

### Files modified

- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

---

## 2026-06-07 — TESTING.md: manual checks for auth + wave 3 commits

### What was changed and why

Added a “Recent commits” manual verification section to `TESTING.md` for `b1f0994` (auth/User TS) and `b29c9e7` (utils wave 3) with route-level smoke steps and regression signals.

### Files modified

- `TESTING.md` — new subsection under manual verification; fixed `lib/auth.js` → `lib/auth.ts` in convert-then-test note

---

## 2026-06-07 — TESTING.md: quick-pass checklists for recent commits

### What was changed and why

Replaced detailed tables with checkbox quick-pass lists for `b1f0994` and `b29c9e7` so manual verification can be ticked off action-by-action.

### Files modified

- `TESTING.md`

---

## 2026-06-07 — TypeScript migration: `lib/checkBlocklist`

### What was built and why

Converted `lib/checkBlocklist.js` to TypeScript with exported `BlocklistResult` / `BlocklistType`. Added unit tests for the three-pass rules (everywhere, exact-name, substring Trie). Moved Trie design notes to `docs/notes/lib/checkBlocklist.md`.

### Files created

- `lib/checkBlocklist.ts`
- `lib/checkBlocklist.test.ts`
- `docs/notes/lib/checkBlocklist.md`

### Files removed

- `lib/checkBlocklist.js`

### Files modified

- `utils/api/checkMultipleBlocklists.ts` — `blockType` uses `BlocklistType`
- `docs/README.md` — index entry for checkBlocklist notes

### Patterns followed

- Slim source + pointer to `docs/notes/` (same as `mongoDataCleanup`, `auth`)
- Blocklist Sets built from lowercased list entries so matching aligns with normalized input
- Co-located `BlocklistResult` type for `checkMultipleBlocklists` consumer

### Verification

- `pnpm test` — 13 suites, 56 tests passed
- `pnpm build` — succeeded

### TODOs

- Small models: `NameLike`, `DescriptionLike`, `Follow`, `Thank`, `Suggestion`, `Report`
- `data/blockList.js` — optional TS conversion when touching blocklist data
- `utils/filevalidation.js` — unused; delete or wire up later

### Next logical step

Convert small models batch (`Follow`, `NameLike`, `DescriptionLike`) following `NameTag.ts` pattern.

---

## 2026-06-07 — checkBlocklist docs: restore original comments

### What was changed and why

Expanded `docs/notes/lib/checkBlocklist.md` with Trie walkthrough, pass-by-pass rules, and design comments from original `checkBlocklist.js`.

### Files modified

- `docs/notes/lib/checkBlocklist.md`

---

## 2026-06-07 — checkBlocklist docs: annotated source

### What was changed and why

Added full annotated `checkBlocklist.ts` source with original inline comments to `docs/notes/lib/checkBlocklist.md`.

### Files modified

- `docs/notes/lib/checkBlocklist.md`

---

## 2026-06-07 — Move `migrateField` into `migrations/utils/`

### What was changed and why

`migrateField` is only used by migration scripts, not runtime app code. Moved from `utils/api/` to `migrations/utils/` so `utils/api` stays app-facing.

### Files created

- `migrations/utils/migrateField.js`

### Files removed

- `utils/api/migrateField.js`

### Files modified

- `migrations/toCamelCase.js` — import `./utils/migrateField.js`

### Next logical step

Convert small models batch (`Follow`, `NameLike`, `DescriptionLike`) following `NameTag.ts` pattern.

---

## 2026-06-07 — TypeScript migration: small models (likes + follow)

### What was built and why

Converted `NameLike`, `DescriptionLike`, and `Follow` to TypeScript following `NameTag.ts` / `User.ts` patterns. Preserved explicit collection names for migration scripts. Moved index learning notes to `docs/notes/models/likes-and-follows.md`.

### Files created

- `models/NameLike.ts`
- `models/DescriptionLike.ts`
- `models/Follow.ts`
- `docs/notes/models/likes-and-follows.md`

### Files removed

- `models/NameLike.js`
- `models/DescriptionLike.js`
- `models/Follow.js`

### Files modified

- `docs/README.md` — index entry for likes-and-follows notes

### Patterns followed

- `I*Document` interfaces + `Model<I*Document>` export
- Explicit collection names (`namelikes`, `descriptionlikes`, `follows`) unchanged
- Extensionless `@/models/*` imports unchanged for app consumers

### Verification

- `pnpm test` — 13 suites, 56 tests passed
- `pnpm build` — succeeded

### TODOs

- Remaining models: `Thank`, `Suggestion`, `Report`, `Name`, `Description`

### Next logical step

Convert `Thank`, `Suggestion`, `Report`; then core `Name` / `Description` models.

---

## 2026-06-07 — likes-and-follows docs: annotated source + examples

### What was changed and why

Expanded `docs/notes/models/likes-and-follows.md` with original index comments, field overview, route usage map, and annotated source snippets for all three models.

### Files modified

- `docs/notes/models/likes-and-follows.md`

---

## 2026-06-07 — TESTING.md: manual checks for checkBlocklist + likes models

### What was changed and why

Added checkbox quick-pass sections for `lib/checkBlocklist` and `NameLike` / `DescriptionLike` manual verification under Manual verification (TypeScript migration).

### Files modified

- `TESTING.md`

---

## 2026-06-07 — TESTING.md: chronological manual verification order

### What was changed and why

Reorganized manual verification checklists oldest migration → newest (wave 1 through likes models); merged regression signals into one table at the end.

### Files modified

- `TESTING.md`

---

## 2026-06-07 — TypeScript migration: Thank, Suggestion, Report

### What was built and why

Converted remaining small moderation/thanks models before core `Name` / `Description`. Preserved `fieldDescriptions` statics on Suggestion/Report and explicit `thanks` collection name.

### Files created

- `models/Thank.ts`
- `models/Suggestion.ts`
- `models/Report.ts`
- `docs/notes/models/moderation-and-thanks.md`

### Files removed

- `models/Thank.js`
- `models/Suggestion.js`
- `models/Report.js`

### Files modified

- `docs/README.md` — index entry for moderation-and-thanks notes

### Patterns followed

- `as const` status/outcome/priority unions (same as `User.ts`)
- `ISuggestionModel` / `IReportModel` for `fieldDescriptions` static typing
- Extensionless `@/models/*` imports unchanged

### Problems and fixes

- **Build:** Mongoose `schema.statics` direct assignment failed type-check — moved `fieldDescriptions` into schema `{ statics: { ... } }` option.
- **Thank `descriptionId` required:** kept legacy `(contentType as string) === "description"` to match existing API (enum is `"descriptions"`).

### Verification

- `pnpm test` — 13 suites, 56 tests passed
- `pnpm build` — succeeded

### Files modified (follow-up)

- `TESTING.md` — §11 manual checks for Thank / Suggestion / Report

### TODOs

- Core models: `Name.js`, `Description.js`

### Next logical step

Convert `Name` and `Description` models.

---

## 2026-06-07 — TESTING.md: restore checkbox progress after reorder

### What was changed and why

Chronological reorder reset §2 (formerly “Quick pass”) from `[x]` back to `[ ]`. Restored eight checked items from git history; added note to preserve checkbox state on future edits.

### Files modified

- `TESTING.md`

---

## 2026-06-07 — contact form: allow Japanese/CJK messages

### What was built and why

`hasRealisticMessage` required 3+ whitespace-separated words — Japanese (and much Chinese) is written without spaces, so legitimate contact submissions failed with “Please enter a valid message.”

### Files modified

- `utils/api/detectBotPatterns.ts` — `isPrimarilyChineseJapaneseKorean` path; Latin-only long single-token check
- `utils/api/detectBotPatterns.test.ts` — Japanese + Chinese message cases

### Problems and fixes

- **Root cause:** English word-count / avg-length heuristics applied to unsegmented Chinese/Japanese/Korean text.
- **Fix:** If ≥50% C/J/K characters (hiragana, katakana, hanzi, hangul), require minimum length only; keep Latin gibberish rules for spam tokens.

### Verification

- `pnpm test -- detectBotPatterns` — 17 tests passed

### Next logical step

Re-test §4 “Non-English message” on `/contact`.

---

## 2026-06-07 — contact form: non-Latin messages (Russian, Thai, etc.)

### What was changed and why

C/J/K-only bypass was too narrow. Refactored to `isPrimarilyLatin`: word-count heuristics apply only when ≥50% of letters are Latin; all other scripts (Cyrillic, Arabic, CJK, Thai, …) need minimum length only.

### Files modified

- `utils/api/detectBotPatterns.ts`
- `utils/api/detectBotPatterns.test.ts` — Russian + Thai cases

### Verification

- `pnpm test -- detectBotPatterns` — all tests passed

---

## 2026-06-07 — contact form: English and Spanish only

### What was built and why

Simplified contact policy for U.S. shelter focus: messages must use Latin script (English or Spanish). Non-Latin text is rejected with an explicit error; form shows the rule before submit.

### Files modified

- `utils/api/detectBotPatterns.ts` — `isEnglishOrSpanishScript`, `CONTACT_MESSAGE_LANGUAGE_ERROR`
- `utils/api/detectBotPatterns.test.ts`
- `app/actions/sendContactEmail.js` — language check before bot heuristics
- `components/Contact/ContactForm.jsx` — helper text under message field
- `TESTING.md` — §4 Spanish allowed / other languages rejected

### Note

Enforcement is by script (Latin letters + Spanish accents), not ML language detection — other Latin languages may pass; CJK, Cyrillic, Arabic, Thai, etc. are blocked.

### Verification

- `pnpm test -- detectBotPatterns`

---

## 2026-06-07 — TypeScript migration: Name and Description (final models)

### What was built and why

Converted the last two Mongoose models — all `models/*` are now TypeScript. Preserved `uniqueValidator` on Name, explicit `names` collection, Description optional `createdBy`.

### Files created

- `models/Name.ts`
- `models/Description.ts`
- `docs/notes/models/name-and-description.md`

### Files removed

- `models/Name.js`
- `models/Description.js`

### Files modified

- `docs/README.md` — index entry
- `TESTING.md` — §12 core content models
- `app/api/names/swr/route.js` — `@models/Name.js` → `@models/Name` (build fix)

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### TODOs

- Migration scripts still import `../models/Name.js` / `Description.js` — update paths if re-run with Node

### Next logical step

Model migration complete; convert high-traffic API routes or `sendContactEmail.js` next.

---

## 2026-06-08 — TypeScript migration: sendContactEmail server action

### What was built and why

Converted the contact form server action to TypeScript with exported `ContactEmailState` for `useActionState` typing. Preserved validation order (honeypot → timing → language → bots → captcha → rate limit → Resend).

### Files created

- `app/actions/sendContactEmail.ts`
- `docs/notes/app/actions/sendContactEmail.md`

### Files removed

- `app/actions/sendContactEmail.js`

### Files modified

- `docs/README.md` — index entry

### Patterns followed

- `getFormString` helper for `FormData` entries
- `RecaptchaVerifyResponse` interface for siteverify JSON
- Guard on missing `RESEND_EMAIL_FROM` / `RESEND_FROM_GMAIL` for strict null checks

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### Next logical step

Convert `app/api/names/route.js` or `ContactForm.jsx` to TypeScript.

---

## 2026-06-08 — sendContactEmail.ts: restore inline comments

### What was changed and why

Re-added section headers and at-a-glance comments from the original `.js` file after TS conversion stripped them.

### Files modified

- `app/actions/sendContactEmail.ts`

---

## 2026-06-08 — TypeScript migration: `app/api/names/route.ts` (first API route)

### What was built and why

Converted the main names CRUD route to TypeScript — first `app/api/*` route in the migration. Typed request bodies; narrowed `getSessionForApis` union; legacy commented Pages-router block moved to notes.

### Files created

- `app/api/names/route.ts`
- `docs/notes/app/api/names-route.md`

### Files removed

- `app/api/names/route.js`

### Files modified

- `docs/README.md` — index entry

### Patterns followed

- `Request` handler signatures; JSON body interfaces per method
- Extensionless `@models/Name`, `@utils/db` imports
- `auth.ok` guard before `auth.session` (discriminated union)
- `new mongoose.Types.ObjectId(contentId)` for DELETE (TS requires `new`)

### Problems and fixes

- **Build:** destructuring `session` before `ok` check failed strict union — use `auth` variable + narrow first.
- **Build:** `tags` assignment needed cast to `ObjectId[]`.

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### TODOs

- Remaining names routes: `swr`, `check-if-content-exists`, likes

### Next logical step

Convert `app/api/description/route.js` (mirror of names) or `ContactForm.jsx` to TypeScript.

---

## 2026-06-08 — names route PUT: fix blocklist condition (`||` not `|`)

### What was changed and why

PUT blocklist guard used bitwise `content | notes` (copy-paste error from legacy JS). Restored logical `content || notes` so blocklist runs when either field is present.

### Files modified

- `app/api/names/route.ts`
- `docs/notes/app/api/names-route.md` — removed obsolete legacy note

---

## 2026-06-08 — TypeScript migration: `app/api/description/route.ts`

### What was built and why

Converted descriptions CRUD route to TypeScript, mirroring `names/route.ts`. Typed helpers (`checkDuplicateDescription`, `returnExistingMessage`) and request bodies; preserved `new Response("Unauthorized")` and `{ error: err.message }` response shapes from the JS version.

### Files created

- `app/api/description/route.ts`
- `docs/notes/app/api/description-route.md`

### Files removed

- `app/api/description/route.js`

### Files modified

- `docs/README.md` — index entry

### Patterns followed

- Same as names route: `auth.ok` narrowing, `notes ?? ""` for blocklist, `new mongoose.Types.ObjectId` for DELETE lookup
- `IDescriptionDocument` for duplicate-check return typing
- Optional `createdBy` on model — non-null assertions where legacy route assumed doc exists

### Verification

- `pnpm test` — 13 suites, 60 tests passed
- `pnpm build` — succeeded

### Next logical step

Convert `ContactForm.jsx` to TypeScript, or smaller API routes (`names/swr`, `description/swr`, check-if-content-exists).

---

## 2026-06-08 — Unit tests for recent migrations (extract + test pure logic)

### What was built and why

Recent route/action migrations were manual-only. Followed existing pattern (`resolveSignInCallback`, `detectBotPatterns`): extract pure validation into `utils/api/*`, add Jest suites. Full handler tests still need DB/auth mocks — not added.

### Files created

- `utils/api/validateContactSubmission.ts` + `.test.ts` — honeypot, timing, required fields, email, lengths, reCAPTCHA
- `utils/api/descriptionDuplicateCheck.ts` + `.test.ts` — duplicate guard decision + 409 payload
- `utils/stringManipulation/check-for-valid-content.test.ts` — name character rules (used by names route)

### Files modified

- `app/actions/sendContactEmail.ts` — uses `validateContactSubmission`
- `app/api/description/route.ts` — uses `descriptionDuplicateCheck`
- `docs/notes/app/actions/sendContactEmail.md`, `docs/notes/app/api/description-route.md`

### Verification

- `pnpm test` — 16 suites, 85 tests passed (+25)

### Still manual / not unit-tested

- Names/description route handlers (Mongoose + `getSessionForApis` mocks)
- Resend email send path
- Model schemas (Mongoose integration)
- `e2e/login.spec.ts` remains the only Playwright flow test

---

## 2026-06-08 — Names validation extract + Playwright `/addnames` and `/contact`

### What was built and why

Extracted names-route validation into unit-tested helpers. Added Playwright specs for contact (timing, language) and addnames (logged-out gate + optional authenticated submit). E2E contact tests use env-gated reCAPTCHA bypass (`E2E_TEST_MODE` / `NEXT_PUBLIC_E2E_TEST_MODE`) only when Playwright starts the server.

### Files created

- `utils/api/validateNameSubmission.ts` + `.test.ts`
- `e2e/addnames.spec.ts`, `e2e/contact.spec.ts`, `e2e/helpers/auth.ts`

### Files modified

- `app/api/names/route.ts` — uses `validateNameSubmission`
- `app/actions/sendContactEmail.ts`, `components/Contact/ContactForm.jsx` — E2E bypass
- `playwright.config.ts` — E2E env on `webServer`
- `docs/notes/app/api/names-route.md`, `TESTING.md`

### Verification

- `pnpm test` — 17 suites, 92 tests passed
- `pnpm test:e2e:local` — 6 passed, 2 skipped (no `PLAYWRIGHT_TEST_*` creds)

### E2E follow-up fixes (freeze + selectors)

- Contact Submit was disabled up to 10s while reCAPTCHA loaded — tests timed out waiting; E2E build now skips that gate
- `pnpm test:e2e` can hang if port 3000 is busy during `build && start` — added `pnpm test:e2e:local` + `scripts/playwright-local.mjs`
- Fixed contact selectors (`input[name=…]`), login strict-mode Register link, addnames logged-out test

---

## 2026-06-08 — E2E: MONGODB_URI_TEST + NextAuth notes

### What was changed and why

Playwright `webServer` now sets `MONGODB_URI` from `MONGODB_URI_TEST` so E2E hits an isolated DB while dev keeps `MONGODB_URI`. Added `pnpm build:e2e` / `pnpm start:e2e` for local E2E server; documented that NextAuth uses the same swapped URI (seed test user once via `/register`).

### Files modified

- `playwright.config.ts`, `package.json`, `scripts/build-e2e.mjs`, `scripts/start-e2e.mjs`, `TESTING.md`

---

## 2026-06-08 — E2E: register reCAPTCHA bypass for test DB seeding

### What was changed and why

`/register` required reCAPTCHA, which fails on localhost. Added same E2E bypass as contact (`e2e-bypass` token when `E2E_TEST_MODE` / `NEXT_PUBLIC_E2E_TEST_MODE` set at build/start).

### Files created

- `utils/api/e2eTestMode.ts`

### Files modified

- `app/api/auth/signup/route.js`, `components/Register/RegisterForm.jsx`
- `components/Contact/ContactForm.jsx`, `app/actions/sendContactEmail.ts` — use shared helper
- `TESTING.md`

---

## 2026-06-08 — `pnpm seed:e2e-user` CLI for test DB

### What was built and why

Browser register + captcha blocked seeding the Playwright user. Script inserts/updates credentials user directly in `MONGODB_URI_TEST` from env vars.

### Files created

- `scripts/seed-e2e-user.mjs`

### Files modified

- `package.json` — `seed:e2e-user` script
- `TESTING.md`

---

## 2026-06-08 — Expand E2E + TESTING.md E2E vs manual matrix

### What was built and why

Added Playwright coverage for manual checks that automate cleanly (contact spam/language/rate limit, login auth, addnames duplicate/blocklist, browse load). Documented which § items E2E replaces vs still manual.

### Files created

- `e2e/browse.spec.ts`, `e2e/helpers/contact.ts`

### Files modified

- `e2e/contact.spec.ts`, `e2e/login.spec.ts`, `e2e/addnames.spec.ts`
- `app/actions/sendContactEmail.ts` — rate limit before E2E email skip
- `TESTING.md`, `docs/notes/app/actions/sendContactEmail.md`

---

## 2026-06-08 — TESTING.md: E2E owns automated flows; manual = captcha/email/gaps

### What was changed and why

Removed manual checklist items now covered by Playwright. Manual section reorganized by what E2E cannot test (captcha, Resend, magic link, multi-user, admin, content depth, Network inspection).

### Files modified

- `TESTING.md`

---

## 2026-06-08 — TypeScript migration: `app/api/auth/signup/route.ts`

### What was built and why

Converted signup API to TypeScript; extracted pure field validation to `validateSignupSubmission` (unit tested). Uses shared `isE2eCaptchaBypass`; removed dead `createSecretKey` import from legacy JS.

### Files created

- `app/api/auth/signup/route.ts`
- `utils/api/validateSignupSubmission.ts`, `validateSignupSubmission.test.ts`
- `docs/notes/app/api/signup-route.md`

### Files modified

- `docs/README.md`

### Files removed

- `app/api/auth/signup/route.js`

### Verification

- `pnpm test` — 98 passed
- `pnpm build` — OK

### Next logical step

Convert `app/api/names/swr/route.js` or `RegisterForm.jsx` to TypeScript.

---

## 2026-06-08 — Restore `.gitattributes` (LF line endings)

### What was changed and why

Re-added repo-level line-ending rules so Git stops warning about LF/CRLF on Windows. Text files use LF; common binary extensions are excluded.

### Files created

- `.gitattributes`

### Next logical step

After pulling this file, run `git add --renormalize .` once if old CRLF files still warn, then recommit.

---

## 2026-06-08 — Follow API: use `Follow` model (not `User.followers`)

### What was changed and why

Followers live in the `follows` collection (`models/Follow.ts`), not on `User`. Reverted mistaken `followers` field on `User`. `updatefollows` now upserts/deletes `Follow` docs; profile and `getASpecificUserByProfileName` load followers via `getUserFollowers`.

### Files created

- `utils/api/getUserFollowers.ts`

### Files modified

- `app/api/user/updatefollows/route.js`
- `app/api/user/getASpecificUserByProfileName/[name]/route.js`
- `app/profile/[profilename]/page.jsx`
- `models/User.ts` (reverted `followers`)
- `scripts/seed-e2e.mjs`, `docs/notes/models/likes-and-follows.md`

---

## 2026-06-08 — E2E: admin, edits, social specs

### What was built and why

Added Playwright coverage for admin access, ownership edits, and social flows using seeded user + admin. Extended fixtures with admin-owned name/description.

### Files created

- `e2e/admin.spec.ts`, `e2e/edits.spec.ts`, `e2e/social.spec.ts`
- `e2e/helpers/seed-lookup.ts`, `e2e/helpers/likes.ts`

### Files modified

- `e2e/fixtures/seed-data.json`, `seed-data.ts`, `scripts/seed-e2e.mjs`
- `TESTING.md`

---

## 2026-06-08 — E2E shared seed fixtures (name, descriptions, admin)

### What was built and why

Single source of truth for seeded test DB content: `e2e/fixtures/seed-data.json` is read by `pnpm seed:e2e` and Playwright tests via `seed-data.ts`. Duplicate name/description specs no longer create-then-duplicate at runtime.

### Files created

- `e2e/fixtures/seed-data.json`, `e2e/fixtures/seed-data.ts`
- `scripts/seed-e2e.mjs`

### Files modified

- `e2e/addnames.spec.ts`, `e2e/adddescriptions.spec.ts`
- `e2e/helpers/auth.ts` — `loginWithAdminCredentials`
- `e2e/helpers/register.ts` — profile name from fixture module
- `package.json`, `TESTING.md`

### Files removed

- `scripts/seed-e2e-user.mjs` (replaced by `seed-e2e.mjs`; `seed:e2e-user` script kept as alias)

### Next logical step

Add admin/ownership E2E using `loginWithAdminCredentials` and seeded admin user.

---

## 2026-06-08 — E2E: move more manual checks (auth, descriptions, blocklist, API shape)

### What was built and why

Reviewed remaining manual verification items and automated flows that do not need captcha, Resend, or a second user: session/dashboard/notifications/profile, sign-out round-trip, description create/detail, duplicate “check if exists” (start vs middle), name/detail page, `fluffy butt` negative blocklist case, editsettings validation, duplicate register email, and names SWR `_id` string shape.

### Files created

- `e2e/auth-session.spec.ts`
- `e2e/adddescriptions.spec.ts`
- `e2e/editsettings.spec.ts`
- `e2e/helpers/descriptions.ts`

### Files modified

- `e2e/helpers/auth.ts` — `openProfileMenu`, `signOutViaNav`
- `e2e/addnames.spec.ts`, `e2e/register.spec.ts`, `e2e/browse.spec.ts`
- `TESTING.md` — E2E bullets + trimmed manual checklist

### Problems encountered

- Description form does not require tags server-side; removed flaky react-select helper.
- Nav menu items use Headless UI `menuitem` role, not `link` / `button` for Profile/Logout.
- Contact rate-limit test must run last in serial `contact.spec.ts` (Spanish + legitimate consume 2 of 3 IP slots).

### TODOs

- Social/notification flows still need a second seeded E2E user.
- Pagination/sort cooldown tests skipped (15s+ waits).
- Full register happy path + default avatar still manual (real captcha).

### Next logical step

Run `pnpm seed:e2e-user && pnpm test:e2e` and fix any flaky tag-select or aggregate `_id` assertions.

---

## 2026-06-08 — E2E: contact spam message + register duplicate profilename

### What was built and why

Gibberish contact message and duplicate `PLAYWRIGHT_TEST_PROFILENAME` on register are automatable with E2E captcha bypass; removed from manual checklist.

### Files created

- `e2e/register.spec.ts`, `e2e/helpers/register.ts`

### Files modified

- `e2e/contact.spec.ts`, `TESTING.md`

---

## 2026-06-09 — TypeScript: `RegisterForm`

### What was changed and why

Converted the register form to TypeScript as part of the signup-route migration. Typed `react-hook-form` values, signup API response/errors (`SignupFieldErrors`), captcha flow, and axios error handling. Removed leftover debug `console.log` / render-side logging.

### Files created

- `components/Register/RegisterForm.tsx`
- `components/FormComponents/RegisterInput.d.ts`
- `components/Shared/actions/GeneralButton.d.ts`

### Files removed

- `components/Register/RegisterForm.jsx`

### Files modified

- `docs/notes/app/api/signup-route.md`

### Verification

- `pnpm build` — OK

### TODOs

- `checkIfNameExists` / `resetData` state helpers are still unused in the JSX (pre-existing).
- `RegisterInput.jsx` / `GeneralButton.jsx` still JS; `.d.ts` stubs only unblock TS consumers.

### Next logical step

Run `pnpm test:e2e e2e/register.spec.ts` or convert `app/api/names/swr/route.js` next.

---

## 2026-06-09 — TypeScript: `names/swr` API route

### What was changed and why

Converted paginated names SWR listing to TypeScript. Extracted pure GET/POST source parsing and sort defaults into `parseNamesSwrRequest.ts` (6 unit tests). Behavior unchanged: POST body + query merge, `_id` sort tiebreaker, 50-item pages.

### Files created

- `app/api/names/swr/route.ts`
- `utils/api/parseNamesSwrRequest.ts`, `parseNamesSwrRequest.test.ts`
- `docs/notes/app/api/names-swr-route.md`

### Files removed

- `app/api/names/swr/route.js`

### Files modified

- `docs/notes/app/api/names-route.md`, `docs/README.md`

### Verification

- `pnpm test -- parseNamesSwrRequest` — 6 passed
- `pnpm build` — OK

### Next logical step

Convert `app/api/description/swr/route.js` (similar shape) or run `pnpm test:e2e e2e/browse.spec.ts`.

---

## 2026-06-09 — TypeScript: `description/swr` API route

### What was changed and why

Converted paginated descriptions SWR listing to TypeScript. Reused `parseNamesSwrRequest.ts` with description-specific helpers (`buildSwrFilterSourceFromSearchParams`, `parseSwrPaginationFromSearchParams`). Preserved original behavior: page/sort always from URL; filters from POST body or query `getAll`. Kept PUT/DELETE 405.

### Files created

- `app/api/description/swr/route.ts`
- `docs/notes/app/api/description-swr-route.md`

### Files removed

- `app/api/description/swr/route.js`

### Files modified

- `utils/api/parseNamesSwrRequest.ts`, `parseNamesSwrRequest.test.ts` (3 new tests, 9 total)
- `docs/notes/app/api/description-route.md`, `docs/README.md`

### Verification

- `pnpm test -- parseNamesSwrRequest` — 9 passed
- `pnpm build` — OK

### Next logical step

Run `pnpm test:e2e e2e/browse.spec.ts` or convert smaller API routes (`check-if-content-exists`, `grabusersfollowing`).

---

## 2026-06-09 — Restore original inline comments on SWR routes

### What was changed and why

Re-added explanatory comments from the original `route.js` files into `names/swr/route.ts`, `description/swr/route.ts`, and `parseNamesSwrRequest.ts` (POST/GET merge, likedIds Case 1/2, filter build, aggregation sections, handler docs).

### Files modified

- `app/api/names/swr/route.ts`
- `app/api/description/swr/route.ts`
- `utils/api/parseNamesSwrRequest.ts`

---

## 2026-06-09 — VS Code: save files with LF line endings

### What was changed and why

Added `"files.eol": "\n"` to workspace settings so Cursor/VS Code saves new edits as LF on Windows, matching `.gitattributes` and reducing CRLF warnings on `git add`.

### Files modified

- `.vscode/settings.json`

### Next logical step

Re-save or convert any files still showing `w/crlf` (`git ls-files --eol | rg w/crlf`), then run `git add` again.

---

## 2026-06-09 — One-time CRLF → LF working-tree normalize

### What was changed and why

`files.eol` only affects new saves; 344 tracked files still had CRLF on disk (`w/crlf`). Converted working copies to LF and added `.editorconfig` so editors respect LF alongside `.gitattributes`.

### Files created

- `.editorconfig`

### Verification

- `git ls-files --eol | rg w/crlf` — 0 matches
- `git add .` — no CRLF warnings

---

## 2026-06-09 — TypeScript: `check-if-content-exists` routes

### What was changed and why

Converted live duplicate-check API routes for names and descriptions to TypeScript. Behavior unchanged: names use blocklist + invalid chars + exact normalized match; descriptions use blocklist + `findStartNormalized`. Removed unused imports (names) and debug `console.log` (descriptions).

### Files created

- `app/api/names/check-if-content-exists/[content]/route.ts`
- `app/api/description/check-if-content-exists/[content]/route.ts`
- `docs/notes/app/api/check-if-content-exists.md`

### Files removed

- `app/api/names/check-if-content-exists/[content]/route.js`
- `app/api/description/check-if-content-exists/[content]/route.js`

### Files modified

- `docs/notes/app/api/names-route.md`, `description-route.md`, `docs/README.md`
- `docs/notes/utils/stringManipulation/findNormalizedMatch.md`

### Verification

- `pnpm build` — OK

### Next logical step

Run `pnpm test:e2e e2e/adddescriptions.spec.ts` or convert `app/api/user/grabusersfollowing` (Follow model fix).

---

## 2026-06-09 — TypeScript + Follow fix: `grabusersfollowing`

### What was changed and why

`GET /api/user/grabusersfollowing/[userid]` no longer queries removed `User.followers`. Added `getUserFollowing` (reads `Follow` where `followedBy = userid`, populates `userId`). Converted route to TypeScript. Profile page commented hook updated for when following UI is re-enabled. E2E social spec asserts the API after admin follow.

### Files created

- `app/api/user/grabusersfollowing/[userid]/route.ts`
- `utils/api/getUserFollowing.ts`
- `docs/notes/app/api/grabusersfollowing-route.md`

### Files removed

- `app/api/user/grabusersfollowing/[userid]/route.js`

### Files modified

- `app/profile/[profilename]/page.jsx`
- `e2e/social.spec.ts`
- `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- `pnpm test:e2e e2e/social.spec.ts` — run with seeded test DB

### Next logical step

Convert `app/api/user/updatefollows/route.js` or `ContactForm.jsx` to TypeScript.

---

## 2026-06-09 — TypeScript: `updatefollows` API route

### What was changed and why

Converted follow toggle route to TypeScript. Behavior unchanged: session auth, upsert/delete `Follow` docs based on `userFollowed` UI flag. Uses `Response.json` (same payloads as before).

### Files created

- `app/api/user/updatefollows/route.ts`
- `docs/notes/app/api/updatefollows-route.md`

### Files removed

- `app/api/user/updatefollows/route.js`

### Files modified

- `docs/notes/app/api/grabusersfollowing-route.md`, `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/social.spec.ts` (existing follow tests)

### Next logical step

Convert `ContactForm.jsx` or like-toggle routes (`names/likes/.../togglelike`).

---

## 2026-06-09 — TypeScript: togglelike routes (names + descriptions)

### What was changed and why

Converted both like-toggle API routes to TypeScript. Preserved transaction flow, original inline comments, and route-specific quirks (names passes `{ req }` to `getSessionForApis`; description calls it with no args; description keeps GET 405).

### Files created

- `app/api/names/likes/[contentId]/togglelike/route.ts`
- `app/api/description/likes/[contentId]/togglelike/route.ts`
- `docs/notes/app/api/togglelike-route.md`

### Files removed

- `app/api/names/likes/[contentId]/togglelike/route.js`
- `app/api/description/likes/[contentId]/togglelike/route.js`

### Files modified

- `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/social.spec.ts`, `e2e/helpers/likes.ts`

### Next logical step

Convert `ContactForm.jsx` or notification routes (`app/api/notifications/names/route.js`).

---

## 2026-06-09 — TypeScript: `ContactForm`

### What was changed and why

Converted contact form to TypeScript. Typed `useActionState` with `ContactEmailState`, captcha flow (v3/v2/E2E bypass), and form submit handler. Renamed default export to `ContactForm` (was `ContactPage` in JSX file). Added `.d.ts` stubs for `StyledInput` / `StyledTextarea`.

### Files created

- `components/Contact/ContactForm.tsx`
- `components/FormComponents/StyledInput.d.ts`, `StyledTextarea.d.ts`

### Files removed

- `components/Contact/ContactForm.jsx`

### Files modified

- `docs/notes/app/actions/sendContactEmail.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/contact.spec.ts`

### Next logical step

Convert notification routes or `app/contact/page.jsx`.

---

## 2026-06-09 — TypeScript: notification API routes

### What was changed and why

Converted all six notification routes (names, descriptions, thanks — each with `mark-read`). Added `parseNotificationPagination` to shared helper. Preserved `$ne` ObjectId comments on names route, thanks PATCH comments, and descriptions error strings (pre-existing copy). Removed debug `console.log` from thanks GET.

### Files created

- `app/api/notifications/names/route.ts`, `names/mark-read/route.ts`
- `app/api/notifications/descriptions/route.ts`, `descriptions/mark-read/route.ts`
- `app/api/notifications/thanks/route.ts`, `thanks/mark-read/route.ts`
- `docs/notes/app/api/notifications-routes.md`

### Files removed

- Six corresponding `route.js` files under `app/api/notifications/`

### Files modified

- `utils/api/getPaginatedNotifications.ts`
- `docs/notes/models/likes-and-follows.md`, `docs/README.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/social.spec.ts`, `e2e/auth-session.spec.ts`

### Next logical step

Convert `app/contact/page.jsx` or `app/(protected)/notifications/page.jsx`.

---

## 2026-06-09 — Restore populate side-effect imports on notification routes

### What was changed and why

Re-added `User` / `Name` / `Description` imports on notification GET routes. They register Mongoose models so `populate()` can resolve `ref` fields — not dead code. Documented in `notifications-routes.md`.

### Files modified

- `app/api/notifications/names/route.ts`
- `app/api/notifications/descriptions/route.ts`
- `app/api/notifications/thanks/route.ts`
- `docs/notes/app/api/notifications-routes.md`

---

## 2026-06-09 — Notifications: unit + E2E tests

### What was built and why

Added notification test coverage: unit tests for `parseNotificationPagination`; E2E for 401, populate shape (guards ref model imports), description notifications, and names mark-read. Thanks notifications remain manual (no seeded thank helper).

### Files created

- `utils/api/getPaginatedNotifications.test.ts`
- `e2e/notifications.spec.ts`

### Files modified

- `e2e/helpers/likes.ts` — `ensureDescriptionLiked`
- `TESTING.md`, `docs/notes/app/api/notifications-routes.md`

### Verification

- `pnpm test -- getPaginatedNotifications` — 3 passed
- `pnpm test:e2e e2e/notifications.spec.ts` — run with seeded test DB

---

## 2026-06-09 — Audit: restore populate side-effect imports across TS conversions

### What was changed and why

Audited all `.populate()` call sites vs git history. Several TS conversions dropped ref-model imports that existed in JS (or were never added on new Follow/findNormalized helpers). Restored `// necessary for populate` imports on names/description routes, check-if-content-exists, getUserFollowers/Following, findNormalizedMatch. Documented full audit table in `notifications-routes.md`.

### Files modified

- `app/api/names/route.ts`, `app/api/description/route.ts`
- `app/api/names/check-if-content-exists/[content]/route.ts`
- `utils/api/getUserFollowers.ts`, `getUserFollowing.ts`
- `utils/stringManipulation/findNormalizedMatch.ts`
- `docs/notes/app/api/notifications-routes.md`

---

## 2026-06-09 — TypeScript: `app/contact/page`

### What was changed and why

Converted contact page wrapper to TypeScript. Renamed default export `CustomError` → `ContactPage` (route is `/contact`). Added `PageTitleWithImages.d.ts` for TS consumer.

### Files created

- `app/contact/page.tsx`
- `components/Shared/typography/PageTitleWithImages.d.ts`

### Files removed

- `app/contact/page.jsx`

### Files modified

- `docs/notes/app/actions/sendContactEmail.md`

### Verification

- `pnpm build` — OK
- E2E: `e2e/contact.spec.ts`

### Next logical step

Convert `app/(protected)/notifications/page.jsx` or `app/api/user/likes/route.js`.

---

## 2026-06-07 — Fix `PageTitleWithImages` props on contact page

### What was changed and why

`app/contact/page.tsx` failed type-check because TypeScript inferred all destructured props (`imgSrc`, `title`, `title2`) as required from the untyped `.jsx` component, ignoring the optional `.d.ts`. Converted the component to `.tsx` with an explicit optional props type.

### Files created

- `components/Shared/typography/PageTitleWithImages.tsx`

### Files removed

- `components/Shared/typography/PageTitleWithImages.jsx`
- `components/Shared/typography/PageTitleWithImages.d.ts`

### Verification

- `pnpm build` — OK
- `pnpm exec tsc --noEmit` — no errors on contact page / `PageTitleWithImages`

### Next logical step

Continue TS migration (`app/(protected)/notifications/page.jsx` or remaining API routes).

---

## 2026-06-07 — TypeScript: `app/(protected)/notifications/page`

### What was changed and why

Converted the protected notifications server page to TypeScript. Kept `User` / `Name` populate side-effect imports; removed unused imports (`Description`, `Thank`, `leanWithStrings`, `MarkThanksRead`). Added `ToggleOneNotificationPage.d.ts` so optional props (`swrForThisUserID`) type-check from TS consumers.

### Files created

- `app/(protected)/notifications/page.tsx`
- `components/Notifications/ToggleOneNotificationPage.d.ts`
- `docs/notes/app/notifications-page.md`

### Files removed

- `app/(protected)/notifications/page.jsx`

### Files modified

- `docs/README.md`
- `docs/notes/app/api/notifications-routes.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/user/likes/route.js` or `ToggleOneNotificationPage.jsx` to `.tsx`.

---

## 2026-06-07 — TypeScript: `ToggleOneNotificationPage`

### What was changed and why

Converted the notifications tab client component to `.tsx` with exported prop types (`NotificationTabConfig`, `NotificationModelType`). Removed unused imports. Added `.d.ts` stubs for `useSWRSimple` and `notificationsContext` so `initialPage` and unread-count context type-check. Expanded `docs/notes/app/notifications-page.md` with SWR lazy-load and mark-read behavior. Removed the interim `ToggleOneNotificationPage.d.ts`.

### Files created

- `components/Notifications/ToggleOneNotificationPage.tsx`
- `hooks/useSwrSimple.d.ts`
- `context/notificationsContext.d.ts`

### Files removed

- `components/Notifications/ToggleOneNotificationPage.jsx`
- `components/Notifications/ToggleOneNotificationPage.d.ts`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/user/likes/route.js` or `NotifListingWrapper.jsx` to `.tsx`.

---

## 2026-06-07 — TypeScript: `hooks/useSwrSimple`

### What was changed and why

Converted notification infinite-SWR hook from `.js` to `.ts`, replacing the interim `.d.ts`. Exported `NotificationModelType`, `UseSWRSimpleOptions`, and `SwrSimpleReturn` from the implementation so `ToggleOneNotificationPage` and `notificationsContext.d.ts` resolve types from the real module.

### Files created

- `hooks/useSwrSimple.ts`

### Files removed

- `hooks/useSwrSimple.js`
- `hooks/useSwrSimple.d.ts`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `context/notificationsContext.js` or `NotifListingWrapper.jsx` to `.tsx`.

---

## 2026-06-07 — TypeScript: `context/notificationsContext`

### What was changed and why

Converted notifications context from `.js` to `.tsx`, replacing the interim `.d.ts`. Exported `NotificationCounts` and `NotificationsContextValue`; typed API response, `resetNotificationType`, and `createContext` null guard.

### Files created

- `context/notificationsContext.tsx`

### Files removed

- `context/notificationsContext.js`
- `context/notificationsContext.d.ts`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `NotifListingWrapper.jsx` or `app/api/user/notifications/route.js` to complete the notifications cluster.

---

## 2026-06-07 — TypeScript: `NotifListingWrapper`

### What was changed and why

Converted shared notifications list shell to `.tsx`. Typed SWR hook, listing component, and recheck/load-more handlers. Removed unused `LikeNotificationListing` import from the JSX original. `docs` accepts `unknown[]` from SWR with `_id` cast at render time.

### Files created

- `components/Notifications/NotifListingWrapper.tsx`

### Files removed

- `components/Notifications/NotifListingWrapper.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/user/notifications/route.js` to complete the notifications cluster, or `LikeNotificationListing.jsx` / `ThankNotificationListing.jsx`.

---

## 2026-06-07 — TypeScript: `app/api/user/notifications/route`

### What was changed and why

Converted unread-count API to TypeScript — completes the notifications cluster (badge API + context + UI + paginated feeds). Exported `UserNotificationsCountsResponse`. Removed unused `leanWithStrings` import; aligned `dbConnect` import with other notification routes; fixed error log message (was "suggestions").

### Files created

- `app/api/user/notifications/route.ts`

### Files removed

- `app/api/user/notifications/route.js`

### Files modified

- `docs/notes/app/api/notifications-routes.md`
- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `LikeNotificationListing.jsx` / `ThankNotificationListing.jsx`, or delete stale duplicate `app/api/notifications/**/route.js` files alongside `.ts` versions.

---

## 2026-06-07 — TypeScript: `wrappers/NotificationWrapper`

### What was changed and why

Converted thin client wrapper for `NotificationsProvider` to `.tsx` so the server `app/layout.js` can mount notification context with typed `children`. Removed unused `useEffect` / `useState` imports from the JSX original.

### Files created

- `wrappers/NotificationWrapper.tsx`

### Files removed

- `wrappers/NotificationWrapper.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `LikeNotificationListing.jsx` / `ThankNotificationListing.jsx` or `NotificationsButton.jsx`.

---

## 2026-06-07 — TypeScript: `LikeNotificationListing`

### What was changed and why

Converted like-notification row component to `.tsx`. Exported `LikeNotification` type aligned with E2E populate shape. Safe optional access on `contentId` / `likedBy`; `ProfileImage` width/height as strings per JS component defaults.

### Files created

- `components/Notifications/LikeNotificationListing.tsx`

### Files removed

- `components/Notifications/LikeNotificationListing.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `ThankNotificationListing.jsx` or `NotificationsButton.jsx`.

---

## 2026-06-07 — TypeScript: `ThankNotificationListing`

### What was changed and why

Converted thank-notification row component to `.tsx`. Exported `ThankNotification` type aligned with `/api/notifications/thanks` populate shape. Same patterns as like rows: optional refs, `ProfileImage` href/onClick, intersection observer fade.

### Files created

- `components/Notifications/ThankNotificationListing.tsx`

### Files removed

- `components/Notifications/ThankNotificationListing.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `NotificationsButton.jsx` or delete stale duplicate `app/api/notifications/**/route.js` files.

---

## 2026-06-07 — TypeScript: `NotificationsButton`

### What was changed and why

Converted nav notification bell to `.tsx` — completes the notifications UI folder. Removed unused `faBell` import and unused context destructuring. Fixed broken `className` template literal (was rendering literal `className="..."` text).

### Files created

- `components/Notifications/NotificationsButton.tsx`

### Files removed

- `components/Notifications/NotificationsButton.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

`app/api/user/likes/route.js`, `hooks/useLocalStorageCooldown.js`, or protected pages (`dashboard`, `editsettings`).

---

## 2026-06-07 — TypeScript: `app/api/user/likes/route`

### What was changed and why

Converted user likes bulk-fetch API to TypeScript. Exported `UserLikesResponse` / `UserLikeEntry` for `LikesContext` consumers. Aligned model imports (`NameLike`, `DescriptionLike`) and `dbConnect` with other user API routes.

### Files created

- `app/api/user/likes/route.ts`
- `docs/notes/app/api/user-likes-route.md`

### Files removed

- `app/api/user/likes/route.js`

### Files modified

- `docs/README.md`
- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `context/LikesContext.js` or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `context/LikesContext`

### What was changed and why

Converted likes context to `.tsx`. Typed `likesRef` maps, `recentLikesRef` session deltas, and API response via `UserLikesResponse` from `app/api/user/likes/route.ts`. Removed unused `useState` import from the JS original.

### Files created

- `context/LikesContext.tsx`

### Files removed

- `context/LikesContext.js`

### Files modified

- `docs/notes/app/api/user-likes-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `wrappers/LikesWrapper.jsx`, `hooks/useLikeState.js`, or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `wrappers/LikesWrapper`

### What was changed and why

Converted thin client wrapper for `LikesProvider` to `.tsx` so the server layout can mount likes context with typed `children` (same pattern as `NotificationWrapper`).

### Files created

- `wrappers/LikesWrapper.tsx`

### Files removed

- `wrappers/LikesWrapper.jsx`

### Files modified

- `docs/notes/app/api/user-likes-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useLikeState.js` or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `hooks/useLikeState`

### What was changed and why

Converted like-button hook to `.ts`. Exported `LikeableContent`, `UseLikeStateParams`; wired `RecentLikeDelta` rollback typing via `useToggleState<RecentLikeDelta>`. Added `hooks/useToggleState.d.ts` for callback generics. `userId` param kept optional (callers pass it; hook does not use it).

### Files created

- `hooks/useLikeState.ts`
- `hooks/useToggleState.d.ts`

### Files removed

- `hooks/useLikeState.js`

### Files modified

- `docs/notes/app/api/togglelike-route.md`
- `docs/notes/app/api/user-likes-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useToggleState.js` or `hooks/useLocalStorageCooldown.js`.

---

## 2026-06-07 — TypeScript: `hooks/useToggleState`

### What was changed and why

Converted debounced optimistic-toggle hook to `.ts`, replacing the interim `.d.ts`. Exported `UseToggleStateOptions<TRollback>` generic; typed `rollbackRef`. Rollback only runs when a snapshot exists (`!== undefined`, so `RecentLikeDelta` `0` still rolls back).

### Files created

- `hooks/useToggleState.ts`

### Files removed

- `hooks/useToggleState.js`
- `hooks/useToggleState.d.ts`

### Files modified

- `docs/notes/app/api/togglelike-route.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useLocalStorageCooldown.js` or `components/Shared/content-actions/LikesButtonAndLikesLogic.js`.

---

## 2026-06-07 — TypeScript: `hooks/useLocalStorageCooldown`

### What was changed and why

Converted localStorage cooldown hook to `.ts`. Exported `UseLocalStorageCooldownReturn`; typed `key`, `duration`, and `trigger()` boolean return. Used by notification recheck and login magic-link cooldown.

### Files created

- `hooks/useLocalStorageCooldown.ts`

### Files removed

- `hooks/useLocalStorageCooldown.js`

### Files modified

- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/Shared/content-actions/LikesButtonAndLikesLogic.js` or `components/Shared/icons/IconWithCount.jsx`.

---

## 2026-06-07 — TypeScript: `LikesButtonAndLikesLogic`

### What was changed and why

Converted listing like button to `.tsx`. Exported `LikesButtonAndLikesLogicProps`; reuses `LikeableContent` and `LikeContentType` from the likes stack. Sign-in gate before `toggleLike`.

### Files created

- `components/Shared/content-actions/LikesButtonAndLikesLogic.tsx`

### Files removed

- `components/Shared/content-actions/LikesButtonAndLikesLogic.js`

### Files modified

- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx` or `components/Shared/icons/IconWithCount.jsx`.

---

## 2026-06-07 — TypeScript: `IconWithCount`

### What was changed and why

Converted icon + unread badge component to `.tsx` (default export still `IconBadge`). Exported `IconBadgeName` (`faBell` | `faHeart` | `thanks`) and `IconBadgeProps`. Used FontAwesome `SizeProp` for `iconSize`.

### Files created

- `components/Shared/icons/IconWithCount.tsx`

### Files removed

- `components/Shared/icons/IconWithCount.jsx`

### Files modified

- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `iconOpenCloseButton.jsx` or `ContainerForLikeShareFlag.jsx`.

---

## 2026-06-07 — TypeScript: thanks cat SVG icon

### What was changed and why

Converted `thanks.jsx` → `thanks.tsx`; removed unused `props` destructuring that forced `props={undefined}` hacks in TS consumers. Exported `ThanksIconProps` with optional `fill`.

### Files created

- `components/Shared/icons/svg/thanks.tsx`

### Files removed

- `components/Shared/icons/svg/thanks.jsx`

### Files modified

- `components/Shared/icons/IconWithCount.tsx`
- `components/Notifications/ThankNotificationListing.tsx`
- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `iconOpenCloseButton.jsx` or `components/Thanks/ThanksButton.jsx`.

---

## 2026-06-07 — TypeScript: `ProfileImage`

### What was changed and why

Converted profile avatar component to `.tsx` with optional `href` and `onClick`. Removed `href={undefined}` hacks from notification listing rows. `width` / `height` typed for Next.js `Image` (`number | \`${number}\``).

### Files created

- `components/Shared/media/ProfileImage.tsx`

### Files removed

- `components/Shared/media/ProfileImage.js`

### Files modified

- `components/Notifications/LikeNotificationListing.tsx`
- `components/Notifications/ThankNotificationListing.tsx`
- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `iconOpenCloseButton.jsx` or `ContainerForLikeShareFlag.jsx`.

---

## 2026-06-07 — TypeScript: `iconOpenCloseButton`

### What was changed and why

Converted notifications tab button to `.tsx`. Generic `IconOpenCloseButtonProps<T>` for tab `value` / `state`; `icon` typed as `IconBadgeName`. Tightened `NotificationTabConfig.icon` in `ToggleOneNotificationPage`.

### Files created

- `components/Shared/actions/iconOpenCloseButton.tsx`

### Files removed

- `components/Shared/actions/iconOpenCloseButton.jsx`

### Files modified

- `components/Notifications/ToggleOneNotificationPage.tsx`
- `docs/notes/app/notifications-page.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `ContainerForLikeShareFlag.jsx` or `components/Thanks/ThanksButton.jsx`.

---

## 2026-06-07 — TypeScript: `ContainerForLikeShareFlag`

### What was changed and why

Converted shared like/share/thanks action chrome wrapper to `.tsx` with typed `children`.

### Files created

- `components/Shared/content-actions/ContainerForLikeShareFlag.tsx`

### Files removed

- `components/Shared/content-actions/ContainerForLikeShareFlag.jsx`

### Files modified

- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/Thanks/ThanksButton.jsx` or `ShareButton.jsx`.

---

## 2026-06-07 — TypeScript: `ThanksButton`

### What was changed and why

Converted listing thanks action button to `.tsx`. Typed `onClick`; added `aria-label`. Uses `ContainerForLikeShareFlag` + `thanks` icon.

### Files created

- `components/Thanks/ThanksButton.tsx`

### Files removed

- `components/Thanks/ThanksButton.jsx`

### Files modified

- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `ShareButton.jsx` or `hooks/useThanksHandler.js`.

---

## 2026-06-07 — TypeScript: `ShareButton`

### What was changed and why

Converted listing share toggle button to `.tsx`. Typed `onClickShowShares` as `MouseEventHandler<HTMLButtonElement>`; optional `shareIconStyling`. Removed unused `useState` import and unused `shares` destructuring (kept optional prop for future use).

### Files created

- `components/Shared/content-actions/ShareButton.tsx`

### Files removed

- `components/Shared/content-actions/ShareButton.jsx`

### Files modified

- `docs/notes/app/api/togglelike-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useThanksHandler.js` or `components/ShowingListOfContent/ContentListing.jsx`.

---

## 2026-06-07 — TypeScript: `useThanksHandler`

### What was changed and why

Converted thanks-dialog state hook to `.ts`. Typed `thanksTarget` as content id string (`openThanks` stores id only). Fixed `confirmThanks` to use `contentId: thanksTarget` (legacy path — `AddThanks` still POSTs directly). Removed debug `console.log` from `openThanks`.

### Files created

- `hooks/useThanksHandler.ts`
- `docs/notes/hooks/useThanksHandler.md`

### Files removed

- `hooks/useThanksHandler.js`

### Files modified

- `docs/notes/models/moderation-and-thanks.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx` or `hooks/useFlagging.js` / `useSuggest.js`.

---

## 2026-06-07 — Cleanup: `useThanksHandler` types

### What was changed and why

Trimmed over-defensive types: `openThanks` now takes `contentId: string` only (matches sole caller). Removed exported `ThanksOpenTarget` / `UseThanksHandlerOptions` aliases and unused axios response handling in legacy `confirmThanks`.

### Files modified

- `hooks/useThanksHandler.ts`
- `docs/notes/hooks/useThanksHandler.md`

---

## 2026-06-07 — TypeScript: `useFlagging` and `useSuggest`

### What was changed and why

Converted listing dialog state hooks to `.ts`. Both store the full listing row (`{ _id: string }` minimum) passed from `FlagButton` / `SuggestButton`.

### Files created

- `hooks/useFlagging.ts`
- `hooks/useSuggest.ts`
- `docs/notes/hooks/useFlagging.md`
- `docs/notes/hooks/useSuggest.md`

### Files removed

- `hooks/useFlagging.js`
- `hooks/useSuggest.js`

### Files modified

- `docs/README.md`
- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx` or `hooks/useEditHandler.js`.

---

## 2026-06-07 — TypeScript: `useEditHandler`

### What was changed and why

Converted edit-dialog + PUT hook to `.ts`. Typed `EditSubmission` from `EditContent` (`content`, `notes`, `tags`), optional SWR `mutate` over paginated pages, and `setLocalData` for local row state.

### Files created

- `hooks/useEditHandler.ts`
- `docs/notes/hooks/useEditHandler.md`

### Files removed

- `hooks/useEditHandler.js`

### Files modified

- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx`.

---

## 2026-06-07 — TypeScript: `ToggeableAlert`, `addHashToArrayString`, `ThanksDialog`

### What was changed and why

Converted three small listing/UI helpers to TypeScript. `ToggeableAlert` typed `toggleState` as `boolean | string` (legacy `addingName` passes message string). `addHashToArrayString` renamed internal function to match file name. `ThanksDialog` typed props; dropped unused `contentId` / `suggestionBy` pass-through to `AddThanks` (never consumed).

### Files created

- `components/Shared/feedback/ToggeableAlert.tsx`
- `utils/stringManipulation/addHashToArrayString.ts`
- `components/Thanks/ThanksDialog.tsx`

### Files removed

- `components/Shared/feedback/ToggeableAlert.jsx`
- `utils/stringManipulation/addHashToArrayString.jsx`
- `components/Thanks/ThanksDialog.jsx`

### Files modified

- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx`.

---

## 2026-06-07 — Cleanup: remove dead `target` from `ThanksDialog`

### What was changed and why

`ThanksDialog` never used `target` beyond an early return; `AddThanks` reads `contentInfo`. Removed prop from dialog and caller; dropped unused `thanksTarget` / `confirmThanks` destructuring in `ContentListing`.

### Files modified

- `components/Thanks/ThanksDialog.tsx`
- `components/ShowingListOfContent/ContentListing.jsx`
- `docs/notes/hooks/useThanksHandler.md`

### Verification

- `pnpm exec tsc --noEmit` — OK

---

## 2026-06-07 — TypeScript: thanks flow (remaining files)

### What was changed and why

Completed thanks-flow migration: data options, submission form, API routes, and mark-read helper. Removed dead commented code from thanks route. Fixed `markThanksRead` fetch URL to `/api/notifications/thanks/mark-read` (old path did not exist). Documented legacy POST `descriptionId` mismatch in thanks-route notes.

### Files created

- `data/ThanksOptions.ts`
- `components/Thanks/AddThanks.tsx`
- `components/Thanks/markThanksRead.tsx`
- `app/api/thanks/route.ts`
- `app/api/thanks/get-thanks-count/route.ts`
- `docs/notes/app/api/thanks-route.md`

### Files removed

- `data/ThanksOptions.js`
- `components/Thanks/AddThanks.jsx`
- `components/Thanks/markThanksRead.jsx`
- `app/api/thanks/route.js`
- `app/api/thanks/get-thanks-count/route.js`

### Files modified

- `docs/notes/models/moderation-and-thanks.md`
- `docs/notes/app/api/notifications-routes.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx`.

---

## 2026-06-07 — Fix: canonical `descriptions` contentType

### What was changed and why

Aligned server branches with UI convention (`"descriptions"` not `"description"`). Thanks POST now sets `descriptionId`; suggestion POST/PUT routes description tags correctly. Added `isDescriptionsContentType()` helper (accepts legacy `"description"` when reading old records).

### Files modified

- `utils/api/checkIfValidContentType.ts`
- `utils/api/checkIfValidContentType.test.ts`
- `app/api/thanks/route.ts`
- `app/api/suggestion/route.js`
- `models/Thank.ts`
- `docs/notes/app/api/thanks-route.md`
- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm test -- checkIfValidContentType` — OK
- `pnpm exec tsc --noEmit` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx`.

---

## 2026-06-07 — TypeScript: `DeleteButton`, `EditButton`, `EditContent`

### What was changed and why

Converted listing row delete/edit menu buttons and edit dialog to `.tsx`. Exported `EditSubmission` from `useEditHandler` for shared save payload typing. Removed unused `useCategoriesForDataType` call from edit dialog.

### Files created

- `components/DeletingData/DeleteButton.tsx`
- `components/Shared/actions/EditButton.tsx`
- `components/EditingData/EditContent.tsx`

### Files removed

- `components/DeletingData/DeleteButton.jsx`
- `components/Shared/actions/EditButton.jsx`
- `components/EditingData/EditContent.jsx`

### Files modified

- `hooks/useEditHandler.ts`
- `docs/notes/hooks/useEditHandler.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx`.

---

## 2026-06-07 — TypeScript: `ContentListing` dependencies (jsx/js imports)

### What was changed and why

Converted remaining non-TS components imported by `ContentListing.jsx` before listing conversion: share bar, delete dialog, flag/suggestion menu buttons and dialogs. Removed dead props on `DeleteDialog` → `DeleteContentNotification`. Context hooks cast until `ReportsContext` / `SuggestionsContext` are TS.

### Files created

- `components/Shared/content-actions/SharingOptionsBar.tsx`
- `components/DeletingData/DeleteDialog.tsx`
- `components/Flagging/FlagButton.tsx`
- `components/Flagging/FlagDialog.tsx`
- `components/Suggestions/SuggestionButton.tsx`
- `components/Suggestions/SuggestionDialog.tsx`

### Files removed

- `components/Shared/content-actions/SharingOptionsBar.jsx`
- `components/DeletingData/DeleteDialog.jsx`
- `components/Flagging/FlagButton.js`
- `components/Flagging/FlagDialog.js`
- `components/Suggestions/SuggestionButton.jsx`
- `components/Suggestions/SuggestionDialog.js`

### Verification

- `pnpm exec tsc --noEmit` — OK

### Next logical step

Convert `components/ShowingListOfContent/ContentListing.jsx`.

---

## 2026-06-07 — TypeScript: `ContentListing`

### What was changed and why

Converted main listing row component to `.tsx`. Exported `ContentListingItem` / `ContentListingProps`. Context hooks cast until reports/suggestions contexts are TS. Fixed undefined `userAlreadySentIdea` (TODO stub). Removed dead props on `EditContent` / `SuggestButton`.

### Files created

- `components/ShowingListOfContent/ContentListing.tsx`
- `docs/notes/components/content-listing.md`

### Files removed

- `components/ShowingListOfContent/ContentListing.jsx`

### Files modified

- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useDeleteConfirmation.js` or `context/ReportsContext.js` / `SuggestionsContext.js`.

---

## 2026-06-07 — Rename `ContentListing` mode: `local` → `standalone`

### What was changed and why

Clearer name for single-content pages that update row state instead of SWR cache.

### Files modified

- `components/ShowingListOfContent/ContentListing.tsx`
- `app/name/[name]/page.jsx`
- `app/description/[id]/page.jsx`
- `components/AddingNewData/CheckIfContentExists.js`
- `docs/notes/components/content-listing.md`
- `hooks/useDeleteConfirmation.js` (comments)

### Verification

- `pnpm exec tsc --noEmit` — OK

---

## 2026-06-07 — TypeScript: `useDeleteConfirmation`, `ReportsContext`, `SuggestionsContext`

### What was changed and why

Converted delete-confirmation hook and moderation client caches to TypeScript. Exported `DeleteTarget`, `ReportsContextValue`, `ReportBucketType`, and `SuggestionsContextValue`. Removed temporary context casts from `ContentListing` and flag/suggest dialog components now that hooks are typed.

### Files created

- `hooks/useDeleteConfirmation.ts`
- `context/ReportsContext.tsx`
- `context/SuggestionsContext.tsx`
- `docs/notes/hooks/useDeleteConfirmation.md`

### Files removed

- `hooks/useDeleteConfirmation.js`
- `context/ReportsContext.js`
- `context/SuggestionsContext.js`

### Files modified

- `components/ShowingListOfContent/ContentListing.tsx`
- `components/Flagging/FlagButton.tsx`, `FlagDialog.tsx`
- `components/Suggestions/SuggestionButton.tsx`, `SuggestionDialog.tsx`
- `docs/README.md`
- `docs/notes/models/moderation-and-thanks.md`
- `docs/notes/hooks/useDeleteConfirmation.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `DeleteContentNotification.jsx`, `AddReport.jsx` / `EditReport.js`.

---

## 2026-06-07 — TypeScript: `AddSuggestion`, `EditSuggestion`

### What was changed and why

Converted suggestion add/edit forms to TypeScript. Exported `SuggestionContentInfo` for `SuggestionDialog` and `useSuggest`. Fixed incorrect-tag checkbox toggle in `AddSuggestion` (was setting state to a single string). Comments/additional-comments state now uses strings.

### Files created

- `components/Suggestions/AddSuggestion.tsx`
- `components/Suggestions/EditSuggestion.tsx`
- `docs/notes/components/suggestion-forms.md`

### Files removed

- `components/Suggestions/AddSuggestion.jsx`
- `components/Suggestions/EditSuggestion.jsx`

### Files modified

- `components/Suggestions/SuggestionDialog.tsx`
- `hooks/useSuggest.ts`
- `docs/README.md`
- `docs/notes/hooks/useSuggest.md`
- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `TagsSelectAndCheatSheet.jsx` / `useTags.js`.

---

## 2026-06-07 — TypeScript: `useTags`, `TagsSelectAndCheatSheet`

### What was changed and why

Converted shared tag-selection hook and form component to TypeScript. Exported `TagOption` and `TagCheckboxChange`. Wrapped handlers in `useCallback`; react-select styles typed with `StylesConfig`.

### Files created

- `hooks/useTags.ts`
- `components/FormComponents/TagsSelectAndCheatSheet.tsx`
- `docs/notes/hooks/useTags.md`
- `docs/notes/components/tags-select-and-cheat-sheet.md`

### Files removed

- `hooks/useTags.js`
- `components/FormComponents/TagsSelectAndCheatSheet.jsx`

### Files modified

- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `CategTagsWrapper.js` or `addingName.jsx` / `addingdescription.jsx`.

---

## 2026-06-07 — TypeScript: `CategTagsWrapper`, add-content forms

### What was changed and why

Converted categories wrapper and add name/description forms to TypeScript. Fixed submit `disabled` props (were string `"disabled"`). Removed dead code in name submit handler. Added `.d.ts` for `CheckIfContentExists` and `WarningMessage` optional props.

### Files created

- `wrappers/CategTagsWrapper.tsx`
- `components/AddingNewData/addingName.tsx`
- `components/AddingNewData/addingdescription.tsx`
- `components/AddingNewData/CheckIfContentExists.d.ts`
- `components/Shared/feedback/WarningMessage.d.ts`
- `docs/notes/components/add-content-forms.md`

### Files removed

- `wrappers/CategTagsWrapper.js`
- `components/AddingNewData/addingName.jsx`
- `components/AddingNewData/addingdescription.jsx`

### Files modified

- `components/FormComponents/StyledTextarea.d.ts` (`id` prop)
- `docs/README.md`
- `docs/notes/context/categories-and-tags.md`
- `docs/notes/hooks/useTags.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `CheckIfContentExists.js` or `CoreListingPagesLogic.jsx`.

---

## 2026-06-07 — React 19: `SubmitEvent` for form handlers

### What was changed and why

Replaced deprecated `FormEvent<HTMLFormElement>` with `SubmitEvent` on all `onSubmit` handlers (React 19 typings). `ContactForm` casts `e.currentTarget` for `FormData`.

### Files modified

- `components/Contact/ContactForm.tsx`
- `components/AddingNewData/addingName.tsx`, `addingdescription.tsx`
- `components/Flagging/AddReport.tsx`, `EditReport.tsx`
- `components/Suggestions/AddSuggestion.tsx`, `EditSuggestion.tsx`
- `components/Thanks/AddThanks.tsx`
- `docs/notes/typescript/type-vs-interface.md`

### Verification

- `pnpm exec tsc --noEmit` — OK

---

## 2026-06-07 — TypeScript: flag/suggestion API routes

### What was changed and why

Converted moderation API routes to TypeScript with exported response types for contexts. Removed dead commented legacy handler code. Fixed suggestion `DELETE` ownership check (`!ownership.ok` instead of truthy object). PUT now converts tag id strings to ObjectIds explicitly.

### Files created

- `app/api/suggestion/route.ts`
- `app/api/flag/flagreportsubmission/route.ts`
- `app/api/flag/getSpecificReport/route.ts`
- `app/api/user/reports/route.ts`
- `app/api/user/suggestions/route.ts`
- `docs/notes/app/api/suggestion-route.md`
- `docs/notes/app/api/flag-routes.md`

### Files removed

- `app/api/suggestion/route.js`
- `app/api/flag/flagreportsubmission/route.js`
- `app/api/flag/getSpecificReport/route.js`
- `app/api/user/reports/route.js`
- `app/api/user/suggestions/route.js`

### Files modified

- `context/ReportsContext.tsx` (import `UserReportsResponse`)
- `context/SuggestionsContext.tsx` (import `UserSuggestionsResponse`)
- `docs/README.md`
- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `CategTagsWrapper.js` or add-content forms.

---

## 2026-06-07 — TypeScript: `CategoriesAndTagsContext`, `useCategoriesForDataType`

### What was changed and why

Converted categories/tags client cache and data-type selector hook to TypeScript. Exported `CategoryWithTags`, `CategoriesAndTagsContextValue`, `CategoriesForDataType`. Removed cast in `TagsSelectAndCheatSheet`. Fixed provider error message (was incorrectly referencing `ReportsProvider`).

### Files created

- `context/CategoriesAndTagsContext.tsx`
- `hooks/useCategoriesForDataType.ts`
- `docs/notes/context/categories-and-tags.md`

### Files removed

- `context/CategoriesAndTagsContext.js`
- `hooks/useCategoriesForDataType.js`

### Files modified

- `components/FormComponents/TagsSelectAndCheatSheet.tsx`
- `docs/README.md`
- `docs/notes/components/tags-select-and-cheat-sheet.md`
- `docs/notes/hooks/useTags.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/suggestion/route.js` and flag API routes, or `CategTagsWrapper.js`.

---

## 2026-06-07 — Docs: `type` vs `interface`

### What was changed and why

Added a short TypeScript conventions note explaining when to use `type` vs `interface`, including how this repo’s migration has been choosing between them.

### Files created

- `docs/notes/typescript/type-vs-interface.md`

### Files modified

- `docs/README.md` (Conventions table link)

### Verification

- N/A (docs only)

---

## 2026-06-07 — TypeScript: `DeleteContentNotification`, `AddReport`, `EditReport`

### What was changed and why

Converted shared delete-confirmation UI and flag report add/edit forms to TypeScript. Exported props types and `ReportContentInfo`. Fixed `additionalCommentsState` / `comments` to use strings (were incorrectly initialized as arrays). Added `setLoading(false)` on early validation exits in `AddReport`.

### Files created

- `components/DeletingData/DeleteContentNotification.tsx`
- `components/Flagging/AddReport.tsx`
- `components/Flagging/EditReport.tsx`
- `docs/notes/components/delete-content-notification.md`
- `docs/notes/components/flag-report-forms.md`

### Files removed

- `components/DeletingData/DeleteContentNotification.jsx`
- `components/Flagging/AddReport.jsx`
- `components/Flagging/EditReport.js`

### Files modified

- `components/FormComponents/StyledTextarea.d.ts` (added `placeholder` to match runtime usage)
- `docs/README.md`
- `docs/notes/hooks/useFlagging.md`
- `docs/notes/models/moderation-and-thanks.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `AddSuggestion.jsx` / `EditSuggestion.jsx`.

---

## 2026-06-07 — TypeScript: `CheckIfContentExists`

### What was changed and why

Converted duplicate-check UI to TypeScript. Exported `CheckIfContentExistsProps` and `CheckContentExistsResponse` typing. Fixed `contentCheck` when `value` is undefined (`(externalValue ?? internalContent).slice(0, 400)`). Optional `setCheckIsProcessing` guarded with `?.`. Removed unused imports and `console.log`. Removed temporary `.d.ts` shim.

### Files created

- `components/AddingNewData/CheckIfContentExists.tsx`
- `docs/notes/components/check-if-content-exists.md`

### Files removed

- `components/AddingNewData/CheckIfContentExists.js`
- `components/AddingNewData/CheckIfContentExists.d.ts`

### Files modified

- `docs/notes/components/add-content-forms.md`
- `docs/notes/app/api/check-if-content-exists.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `CoreListingPagesLogic.jsx` or `app/fetchname/page.js`.

---

## 2026-06-07 — Tighten `CheckContentExistsResponse` type

### What was changed and why

Removed redundant `| string` from `type` union (it collapsed the literals to plain `string`). Added optional `error` to match 500 responses from the check-if-exists routes.

### Files modified

- `components/AddingNewData/CheckIfContentExists.tsx`

### Verification

- `pnpm exec tsc --noEmit` — OK

---

## 2026-06-07 — TypeScript: `CoreListingPagesLogic`

### What was changed and why

Converted shared listing shell to TypeScript. Exported `CoreListingPageLogicProps`. Added `hooks/useSwrPagination.d.ts` for hook param/return types. Removed dead `setPageFunction` and unused `filterCooldownRef` prop (FilteringSidebar never read it). Removed unused imports/vars (`CheckForMoreData`, `userName`, `profileImage`). `LinkButton` cast for optional style props (same pattern as `SharingOptionsBar`).

### Files created

- `components/CoreListingPagesLogic.tsx`
- `hooks/useSwrPagination.d.ts`
- `docs/notes/components/core-listing-pages-logic.md`

### Files removed

- `components/CoreListingPagesLogic.jsx`

### Files modified

- `docs/notes/components/content-listing.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `ProfilePagesLogic.jsx`, `ToggleOneContentPage.jsx`, or `app/fetchname/page.js`.

---

## 2026-06-07 — Restore inline comments in `CoreListingPagesLogic.tsx`

### What was changed and why

Re-added section markers and explanatory comments from the original `.jsx` that were dropped during TS conversion.

### Files modified

- `components/CoreListingPagesLogic.tsx`

---

## 2026-06-07 — TypeScript: `ProfilePagesLogic`, `ToggleOneContentPage`

### What was changed and why

Converted profile listing shell and dashboard/profile tab switcher to TypeScript. Exported `ProfilePagesLogicProps`, `ToggleOneContentPageProps`, `ToggleContentTab`, and `ToggleContentListItem`. Preserved inline comments from originals. Removed dead `setPageFunction` from profile listing. Added `isValidating` to profile `Pagination` (required by TS). `generalOpenCloseButton` cast for tab props.

### Files created

- `components/ProfilePagesLogic.tsx`
- `components/ShowingListOfContent/ToggleOneContentPage.tsx`
- `docs/notes/components/profile-pages-logic.md`
- `docs/notes/components/toggle-one-content-page.md`

### Files removed

- `components/ProfilePagesLogic.jsx`
- `components/ShowingListOfContent/ToggleOneContentPage.jsx`

### Files modified

- `docs/notes/components/core-listing-pages-logic.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `dashboard.jsx` / `profile.jsx` or `app/fetchname/page.js`.

---

## 2026-06-07 — Remove unused `ProfilePagesLogic`

### What was changed and why

Deleted dead profile listing component — nothing imported it; profile/dashboard use `ToggleOneContentPage` + `CoreListingPageLogic` instead.

### Files removed

- `components/ProfilePagesLogic.tsx`
- `docs/notes/components/profile-pages-logic.md`

### Files modified

- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK

---

## 2026-06-07 — TypeScript: `dashboard`, `profile`

### What was changed and why

Converted dashboard and profile client pages to TypeScript. Exported `DashboardProps`, `ProfileProps`, and `ProfileUserData`. Typed `contentList` with `ToggleContentListItem`. Removed dead `namesLikes` / `descriptionsLikes` props to `PointSystemList` on dashboard (component never read them). Safe optional chaining for edit button (`session?.user?.id`). Preserved inline comments from originals.

### Files created

- `components/dashboard.tsx`
- `components/profile.tsx`
- `docs/notes/components/dashboard.md`
- `docs/notes/components/profile.md`

### Files removed

- `components/dashboard.jsx`
- `components/profile.jsx`

### Files modified

- `docs/notes/components/toggle-one-content-page.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/fetchname/page.js` or `app/(protected)/dashboard/page.js`.

---

## 2026-06-07 — Remove dead `likedNames` / `likedDescriptions` from `Dashboard`

### What was changed and why

Dropped unused props from `Dashboard` and dashboard page. Fav tabs already read liked IDs from `LikesContext` through `ToggleOneContentPage` → `CoreListingPageLogic` → `useSwrPagination`.

### Files modified

- `components/dashboard.tsx`
- `app/(protected)/dashboard/page.tsx` (was `page.js` when props removed)
- `docs/notes/components/dashboard.md`

### Verification

- `pnpm exec tsc --noEmit` — OK

---

## 2026-06-07 — TypeScript: `app/(protected)/dashboard/page`

### What was changed and why

Converted dashboard server route to TypeScript. `void` side-effect imports for tag models (populate). Removed unnecessary `await` on `session.user.id`. `?? []` fallback for lean query results. `redirect()` without `return` (Next.js 15 pattern).

### Files created

- `app/(protected)/dashboard/page.tsx`
- `docs/notes/app/dashboard-page.md`

### Files removed

- `app/(protected)/dashboard/page.js`

### Files modified

- `docs/notes/components/dashboard.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/fetchname/page.js` or `app/profile/[profilename]/page.jsx`.

---

## 2026-06-07 — Side-effect imports for Mongoose populate models

### What was changed and why

Replaced `import Model from "..."; void Model` with `import "@/models/..."` wherever models are only loaded to register refs for `.populate()`. Documented convention in `mongoDataCleanup.md`.

### Files modified

- `app/(protected)/dashboard/page.tsx`
- `app/(protected)/notifications/page.tsx`
- `app/api/names/route.ts`, `check-if-content-exists/[content]/route.ts`
- `app/api/description/route.ts`, `suggestion/route.ts`, `thanks/route.ts`
- `app/api/notifications/names/route.ts`, `descriptions/route.ts`, `thanks/route.ts`
- `utils/api/getUserFollowers.ts`, `getUserFollowing.ts`
- `utils/stringManipulation/findNormalizedMatch.ts`
- `docs/notes/utils/mongoDataCleanup.md`

### Verification

- `pnpm exec tsc --noEmit` — OK

---

## 2026-06-07 — TypeScript: `app/fetchname/page`

### What was changed and why

Converted public name-lookup page to TypeScript. Renamed default export to `FetchNamePage`. Removed unused imports (`addingName`, `useSession`). Typed input handler and `nameInvalidInput` state. `maxLength` as number constant.

### Files created

- `app/fetchname/page.tsx`
- `docs/notes/app/fetchname-page.md`

### Files removed

- `app/fetchname/page.js`

### Files modified

- `docs/notes/components/check-if-content-exists.md`
- `docs/notes/components/add-content-forms.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/addnames/page.js` or `app/profile/[profilename]/page.jsx`.

---

## 2026-06-07 — TypeScript: `app/profile/[profilename]/page`

### What was changed and why

Converted profile server route to TypeScript. Typed `params` as `Promise<{ profilename: string }>`. Reused `ProfileUserData` from `profile.tsx`. Side-effect imports for tag models. Removed dead code: `usersLikedContent` / `NameLikes` / session fetch (never passed to `Profile`), `getUserFollowing`, `console.log`. Dropped `JSON.parse(JSON.stringify(...))` — `leanWithStrings` already returns serializable plain objects.

### Files created

- `app/profile/[profilename]/page.tsx`
- `docs/notes/app/profile-page.md`

### Files removed

- `app/profile/[profilename]/page.jsx`

### Files modified

- `docs/notes/components/profile.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/addnames/page.js` or `app/fetchnames/page.jsx`.

---

## 2026-06-07 — TypeScript: `app/profile/[profilename]/page`

### What was changed and why

Converted profile server route to TypeScript. Typed `params` as `Promise<{ profilename: string }>`. Reused `ProfileUserData` from `profile.tsx`. Side-effect imports for tag models. Removed dead code: `usersLikedContent` / `NameLikes` / session fetch (never passed to `Profile`), `getUserFollowing`, `console.log`. Dropped `JSON.parse(JSON.stringify(...))` — `leanWithStrings` already returns serializable plain objects.

### Files created

- `app/profile/[profilename]/page.tsx`
- `docs/notes/app/profile-page.md`

### Files removed

- `app/profile/[profilename]/page.jsx`

### Files modified

- `docs/notes/components/profile.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/addnames/page.js` or `app/fetchnames/page.jsx`.

---

## 2026-06-07 — TypeScript: `app/addnames/page`

### What was changed and why

Converted add-names page shell to TypeScript. Renamed default export to `AddNamesPage`. Form logic remains in `addingName.tsx`.

### Files created

- `app/addnames/page.tsx`
- `docs/notes/app/addnames-page.md`

### Files removed

- `app/addnames/page.js`

### Files modified

- `docs/notes/components/add-content-forms.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/adddescriptions/page.js` or `app/fetchnames/page.jsx`.

---

## 2026-06-07 — TypeScript: `app/fetchnames/page`

### What was changed and why

Converted fetch-names listing route to TypeScript. Removed dead server prefetch (`NameLikes`, session, legacy props never read by `CoreListingPageLogic`). Page now matches slim `fetchdescriptions` pattern. Dropped unused `sessionFromServer` / `usersLikedContent` from `CoreListingPageLogicProps`.

### Files created

- `app/fetchnames/page.tsx`
- `docs/notes/app/fetchnames-page.md`

### Files removed

- `app/fetchnames/page.jsx`

### Files modified

- `components/CoreListingPagesLogic.tsx`
- `docs/notes/components/core-listing-pages-logic.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/fetchdescriptions/page.jsx`.

---

## 2026-06-07 — Add `docs/FUTURE.md` (likes prefetch plan)

### What was changed and why

Documented post–TypeScript migration backlog. First item: Option B — server-fetch likes and seed `LikesProvider` (not reviving dead `fetchnames` page props).

### Files created

- `docs/FUTURE.md`

### Files modified

- `docs/README.md`

---

## 2026-06-07 — TypeScript: `app/fetchdescriptions/page`

### What was changed and why

Converted fetch-descriptions listing route to TypeScript. Renamed default export to `FetchDescriptionsPage`. Same slim pattern as `fetchnames/page.tsx`.

### Files created

- `app/fetchdescriptions/page.tsx`
- `docs/notes/app/fetchdescriptions-page.md`

### Files removed

- `app/fetchdescriptions/page.jsx`

### Files modified

- `docs/notes/app/fetchnames-page.md`
- `docs/notes/components/core-listing-pages-logic.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

---

## 2026-06-07 — TypeScript: `app/adddescriptions/page`

### What was changed and why

Converted add-descriptions page shell to TypeScript. Server component (no page-level `useSession` — form handles auth). Renamed export to `AddDescriptionsPage`.

### Files created

- `app/adddescriptions/page.tsx`
- `docs/notes/app/adddescriptions-page.md`

### Files removed

- `app/adddescriptions/page.js`

### Files modified

- `docs/notes/components/add-content-forms.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `hooks/useSwrPagination.js` or `components/ShowingListOfContent/pagination.js`.

---

## 2026-06-07 — Remove dead `DashboardChartForFavDescriptions`

### What was changed and why

Deleted unused component — nothing imported it; render body was fully commented out. Fav descriptions on the dashboard use `ToggleOneContentPage` → `CoreListingPageLogic` with `restrictSwrToLikedNames` instead.

### Files removed

- `components/ShowingListOfContent/DashboardChartForFavDescriptions.jsx`

---

## 2026-06-07 — TypeScript: listing stack (`useSwrPagination`, `pagination`, `FilteringSidebar`)

### What was changed and why

Converted the three modules that power browse/profile listing pages to TypeScript. Fixed `useLikes()` rules-of-hooks violation (now called unconditionally at hook top). Replaced filter reset `handleApplyFilters("reset")` with `handleApplyFilters(true)`. Removed unused `startCooldown` prop from `FilteringSidebar` (never used in component). Deleted `useSwrPagination.d.ts` — types live in the `.ts` hook file.

### Files created

- `hooks/useSwrPagination.ts`
- `components/ShowingListOfContent/pagination.tsx`
- `components/Filtering/FilteringSidebar.tsx`
- `docs/notes/hooks/useSwrPagination.md`
- `docs/notes/components/pagination.md`
- `docs/notes/components/filtering-sidebar.md`

### Files removed

- `hooks/useSwrPagination.js`
- `hooks/useSwrPagination.d.ts`
- `components/ShowingListOfContent/pagination.js`
- `components/Filtering/FilteringSidebar.jsx`

### Files modified

- `components/CoreListingPagesLogic.tsx` — drop dead `startCooldown` prop on filter sidebar
- `docs/notes/components/core-listing-pages-logic.md`
- `docs/notes/app/api/names-swr-route.md`, `description-swr-route.md`
- `docs/README.md`

### Patterns followed

- Export prop/params types from converted modules (`PaginationProps`, `FilteringSidebarProps`, `UseSwrPaginationParams`)
- `"use client"` on hook and pagination (hooks)
- Preserve preload/cooldown comments from original `pagination.js`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert form primitives used by filters: `StyledCheckbox.jsx`, `StyledInput.jsx`. Then single-content pages `app/name/[name]/page.jsx`, `app/description/[id]/page.jsx`.

---

## 2026-06-07 — Docs: preserve listing-stack behavioral notes

### What was changed and why

Listing-stack `docs/notes/` files were too bare after TS migration. Expanded them with original inline comments from `useSwrPagination.js`, `pagination.js`, `FilteringSidebar.jsx`, and `CoreListingPagesLogic.jsx` (recovered via git). Added migration convention doc so future conversions move long comments into notes files.

### Files created

- `docs/notes/typescript/preserving-migration-notes.md`

### Files modified

- `docs/notes/hooks/useSwrPagination.md` — SWR infinite rationale, getKey, revalidate flags, liked-only mode
- `docs/notes/components/pagination.md` — preload overrides, filter boundary useEffect, 50/page cap, rejected fixes
- `docs/notes/components/filtering-sidebar.md` — quick-filter IDs, StyledCheckbox id bug, apply/reset flow
- `docs/notes/components/core-listing-pages-logic.md` — two-layer pagination, slice/mutate, drawer, cooldowns
- `docs/README.md` — link to preserving-migration-notes convention
- `hooks/useSwrPagination.ts`, `pagination.tsx`, `FilteringSidebar.tsx` — restored short inline comments + doc pointers

---

## 2026-06-07 — Docs: code excerpts in listing-stack notes

### What was changed and why

User should not need to switch between docs and source. Added representative code blocks (with file-path comments) to listing-stack notes; updated preserving-migration-notes convention and docs README.

### Files modified

- `docs/notes/hooks/useSwrPagination.md`
- `docs/notes/components/pagination.md`
- `docs/notes/components/filtering-sidebar.md`
- `docs/notes/components/core-listing-pages-logic.md`
- `docs/notes/typescript/preserving-migration-notes.md`
- `docs/README.md`

---

## 2026-06-07 — Restore inline comments in listing stack source

### What was changed and why

Re-added helpful inline comments stripped during TS conversion (pagination preload/UI, FilteringSidebar section labels, checkbox accessibility note on `value`, useSwrPagination getKey). Long bug history stays in docs; short pointers remain in code.

### Files modified

- `components/ShowingListOfContent/pagination.tsx`
- `components/Filtering/FilteringSidebar.tsx`
- `hooks/useSwrPagination.ts`
- `docs/notes/typescript/preserving-migration-notes.md`

---

## 2026-06-07 — TypeScript: form primitives and siblings

### What was changed and why

Converted shared form components to TypeScript with exported prop types. `StyledCheckbox.description` is optional (no empty string needed in FilteringSidebar). `RegisterInput` now honors `className` on the input (was passed from RegisterForm but ignored in JS). Preserved inline comments (checkbox id/mobile focus, StyledSelect SSR/hydration, RegisterInput helperText cases).

### Files created

- `components/FormComponents/StyledCheckbox.tsx`
- `components/FormComponents/StyledInput.tsx`
- `components/FormComponents/StyledTextarea.tsx`
- `components/FormComponents/StyledSelect.tsx`
- `components/FormComponents/RegisterInput.tsx`
- `components/FormComponents/CheckboxWithLabelAndDescription.tsx`
- `components/AddingNewData/preserveTextAfterSubmission.tsx`
- `docs/notes/components/form-components.md`

### Files removed

- `components/FormComponents/*.jsx` (6 files) and `preserveTextAfterSubmission.jsx`

### Files modified

- `components/Filtering/FilteringSidebar.tsx`
- `docs/notes/components/add-content-forms.md`, `filtering-sidebar.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/name/[name]/page.jsx` and `app/description/[id]/page.jsx`, then `app/api/categories-and-tags/route.js`.

---

## 2026-06-07 — Docs: form-components special-behavior notes

### What was changed and why

Expanded `form-components.md` with inline-comment behavior (StyledCheckbox id/mobile hiding, StyledSelect SSR/hydration, RegisterInput helperText cases). Updated preserving-migration-notes convention.

### Files modified

- `docs/notes/components/form-components.md`
- `docs/notes/typescript/preserving-migration-notes.md`

---

## 2026-06-07 — Delete unused `CheckboxWithLabelAndDescription`

### What was changed and why

Removed orphaned component — no imports anywhere. Flag report categories use `StyledCheckbox` in `AddReport.tsx`. `addingName.jsx` once imported it but never rendered it.

### Files removed

- `components/FormComponents/CheckboxWithLabelAndDescription.tsx`

### Files modified

- `docs/notes/components/form-components.md` — removed section; note `AddReport` uses `StyledCheckbox` for categories

---

## 2026-06-07 — TypeScript: single-content pages (`name/[name]`, `description/[id]`)

### What was changed and why

Converted standalone detail routes to TypeScript. Renamed exports `Postid` → `NamePage` / `DescriptionPage`. Populate-only models via `import "@/models/NameTag"` / `DescriptionTag`. Description page: `mongoose.Types.ObjectId` + `isValid` → `notFound()` instead of `require("mongodb").ObjectId`. Dropped redundant Font Awesome CSS import on description page (children import it). `leanWithStrings` result cast `as unknown as ContentListingItem` for populate typing.

### Files created

- `app/name/[name]/page.tsx`
- `app/description/[id]/page.tsx`
- `docs/notes/app/name-page.md`
- `docs/notes/app/description-page.md`

### Files removed

- `app/name/[name]/page.jsx`
- `app/description/[id]/page.jsx`

### Files modified

- `docs/notes/components/content-listing.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/api/categories-and-tags/route.js`.

---

## 2026-06-07 — TypeScript: `app/api/categories-and-tags/route`

### What was changed and why

Converted categories/tags API to TypeScript. Exported `CategoriesAndTagsResponse`. Preserved `revalidate = 10800` and parallel `leanWithStrings` + populate queries. Documented relationship to layout `getCategoriesAndTagsWithTTL` cache.

### Files created

- `app/api/categories-and-tags/route.ts`
- `docs/notes/app/api/categories-and-tags-route.md`

### Files removed

- `app/api/categories-and-tags/route.js`

### Files modified

- `docs/notes/context/categories-and-tags.md`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `app/layout.js` (still loads categories for `CategTagsWrapper`) or auth pages (`login.jsx`, `register/page.js`).

---

## 2026-06-07 — TypeScript: `app/layout`

### What was changed and why

Converted root server layout to TypeScript. Preserved metadata, 3-hour in-memory `getCategoriesAndTagsWithTTL` cache, `safeSession` normalization, provider wrapper tree, and inline layout comments. Dropped unused `LinkButton` / `Image` imports from the JS original. Typed cache with `CategoryWithTags[]` from context.

### Files created

- `app/layout.tsx`
- `docs/notes/app/root-layout.md`

### Files removed

- `app/layout.js`

### Files modified

- `docs/README.md`
- `docs/notes/context/categories-and-tags.md`
- `docs/notes/app/api/categories-and-tags-route.md`
- `docs/notes/app/notifications-page.md`
- `docs/notes/app/api/user-likes-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert auth pages (`login.jsx`, `register/page.js`, `forgotpassword.jsx`, `ResetPassword.jsx`) or `(protected)/layout.jsx`.

---

## 2026-06-07 — TypeScript: blockList + small UI / social list components

### What was changed and why

Converted seven leaf modules: profanity data (`blockList`), shared loading/login UI, landing-page YouTube embed, profile follow/follower modals, and `SingleOpenGroup` accordion helper. Typed props with `FollowingUser` / `FollowerUser` / `Session`. Removed dead imports (`Image`, unused `framer-motion` in `SingleOpenGroup`, unused React hooks in following list).

### Files created

- `data/blockList.ts`
- `components/Shared/ui/LoadingSpinner.tsx`
- `components/Shared/feedback/MustLoginMessage.tsx`
- `components/ShowingListOfContent/YoutubeEmbed.tsx`
- `components/ShowingListOfContent/UsersFollowingList.tsx`
- `components/ShowingListOfContent/UsersFollowersList.tsx`
- `components/ShowingListOfContent/SingleOpenGroup.tsx`
- `docs/notes/data/blockList.md`
- `docs/notes/components/ui/small-ui-components.md`
- `docs/notes/components/showing-list-of-content/youtube-and-social-lists.md`

### Files removed

- `data/blockList.js`
- `components/Shared/ui/LoadingSpinner.js`
- `components/Shared/feedback/MustLoginMessage.js`
- `components/ShowingListOfContent/YoutubeEmbed.js`
- `components/ShowingListOfContent/UsersFollowingList.js`
- `components/ShowingListOfContent/UsersFollowersList.jsx`
- `components/ShowingListOfContent/SingleOpenGroup.jsx`

### Files modified

- `utils/api/getUserFollowers.ts` — export `FollowerUser` type
- `docs/README.md`
- `docs/notes/lib/checkBlocklist.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert auth pages (`login.jsx`, `register/page.js`) or `FollowButton.jsx` / profile follow UI wiring.

---

## 2026-06-07 — Remove unused `SingleOpenGroup`

### What was changed and why

Deleted `SingleOpenGroup` — zero imports in the repo; accordion behavior lives in `ToggleOneContentPage` and `ToggleOneNotificationPage`.

### Files removed

- `components/ShowingListOfContent/SingleOpenGroup.tsx`

### Files modified

- `docs/notes/components/showing-list-of-content/youtube-and-social-lists.md`
- `docs/README.md`

### Verification

- No app imports to update; `tsc` / build not re-run (delete-only).

---

## 2026-06-07 — TypeScript: `ReusableSmallComponents/buttons`

### What was changed and why

Converted all remaining JS/JSX button primitives to `.tsx`. Merged `GeneralButton.d.ts` and `WarningMessage.d.ts` into source. Renamed `generalOpenCloseButton` → `GeneralOpenCloseButton.tsx` with generic tab typing. Removed `ComponentType` casts in `ToggleOneContentPage`, `SharingOptionsBar`, and `CoreListingPagesLogic`. Fixed `FollowButton` effect deps and sign-in guard; removed unused `ToastContainer`. Fixed stray quote in `DisabledButton` class string. Removed debug `console.log` from open/close tab button.

### Files created

- `components/Shared/actions/GeneralButton.tsx`
- `components/Shared/actions/LinkButton.tsx`
- `components/Shared/actions/DisabledButton.tsx`
- `components/Shared/actions/ClosingXButton.tsx`
- `components/Shared/actions/GoToTopButton.tsx`
- `components/ReusableSmallComponents/buttons/CheckForMoreDataButton.tsx`
- `components/Shared/actions/ReturnToPreviousPage.tsx`
- `components/Shared/actions/GeneralOpenCloseButton.tsx`
- `components/Shared/feedback/WarningMessage.tsx`
- `components/Shared/content-actions/FollowButton.tsx`
- `docs/notes/components/reusable-buttons.md`

### Files removed

- All corresponding `.jsx` / `.js` / `.d.ts` in `buttons/`

### Files modified

- `components/ShowingListOfContent/ToggleOneContentPage.tsx`
- `components/CoreListingPagesLogic.tsx`
- `components/Shared/content-actions/SharingOptionsBar.tsx`
- `components/ShowingListOfContent/UsersFollowingList.tsx`
- `components/ShowingListOfContent/UsersFollowersList.tsx`
- `docs/README.md`
- `docs/notes/components/showing-list-of-content/youtube-and-social-lists.md`
- `docs/notes/models/likes-and-follows.md`
- `docs/notes/app/api/updatefollows-route.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert auth pages (`login.jsx`, `register/page.js`) or `NavLayoutwithSettingsMenu.js`.

---

## 2026-06-07 — Remove unused `CheckForMoreDataButton`

### What was changed and why

Deleted `CheckForMoreDataButton.tsx` — zero imports in the repo (dead code from an earlier pagination experiment).

### Files removed

- `components/ReusableSmallComponents/buttons/CheckForMoreDataButton.tsx`

### Files modified

- `docs/notes/components/reusable-buttons.md`

---

## 2026-06-07 — TypeScript: `ReusableSmallComponents` (non-buttons)

### What was changed and why

Converted remaining JS/JSX in `components/ReusableSmallComponents/`: GifHover, list/heading helpers, ShowTime, icons/SVGs, author row. Renamed `SmallCenteredheading.jsx` → `SmallCenteredHeading.tsx`. Removed unused `Image` import from author row component. `PostersImageUsernameProfileName` still has zero external imports.

### Files created

- `components/Shared/media/GifHover.tsx`
- `components/Shared/lists/ListWithPawPrintIcon.tsx`
- `components/Shared/media/ShowTime.tsx`
- `components/ReusableSmallComponents/PostersImageUsernameProfileName.tsx`
- `components/Shared/typography/WideCenteredHeading.tsx`
- `components/Shared/typography/SmallCenteredHeading.tsx`
- `components/Shared/icons/XSvgIcon.tsx`
- `components/Shared/icons/PawPrintIcon.tsx`
- `components/Shared/icons/svg/NounBlackCatIcon.tsx`
- `components/Shared/icons/svg/MagicRabbitSVG.tsx`
- `docs/notes/components/reusable-small-components.md`

### Files removed

- All corresponding `.js` / `.jsx` in `ReusableSmallComponents/` (non-buttons)

### Files modified

- `app/(protected)/editsettings/page.js` — `SmallCenteredHeading` import path
- `components/AddingNewData/ImageUpload.js` — same
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert auth pages (`login.jsx`, `register/page.js`) or `NavLayoutwithSettingsMenu.js`.

---

## 2026-06-07 — Delete `PostersImageUsernameProfileName`; backlog `ShowTime`

### What was changed and why

Removed dead `PostersImageUsernameProfileName` — superseded by inline author UI in `ContentListing`. Kept `ShowTime` for future use; added `docs/FUTURE.md` section to revisit timestamps on content rows and notification listings.

### Files removed

- `components/ReusableSmallComponents/PostersImageUsernameProfileName.tsx`

### Files modified

- `components/Shared/media/ShowTime.tsx` — FUTURE.md pointer in header
- `docs/FUTURE.md`
- `docs/notes/components/reusable-small-components.md`

### Verification

- No app imports to update; delete-only + docs.

---

## 2026-06-07 — TypeScript: admin stack + ParagraphRender

### What was changed and why

Converted admin context/wrapper, nav dropdown, and paragraph helper to TypeScript. Fixed `AdminWrapper` to pass `isAdminServer={isAdmin}` (was `isAdmin` prop name mismatch — server seed never reached provider). Removed unused `AdminProvider` import from `(admin)/layout.jsx`. Renamed default export to `AdminDropdownMenu` (file name match).

### Files created

- `context/AdminContext.tsx`
- `wrappers/AdminWrapper.tsx`
- `components/NavBar/NavBarPieces/DesktopNavBar/AdminDropdownMenu.tsx`
- `components/ShowingListOfContent/ParagraphRenderBasedOnStringProperty.tsx`
- `docs/notes/context/admin-context.md`
- `docs/notes/components/paragraph-render.md`

### Files removed

- `context/AdminContext.js`
- `wrappers/AdminWrapper.js`
- `components/NavBar/NavBarPieces/DesktopNavBar/AdminDropdownMenu.js`
- `components/ShowingListOfContent/ParagraphRenderBasedOnStringProperty.jsx`

### Files modified

- `app/(admin)/layout.jsx`
- `docs/README.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `(admin)/layout.jsx` and admin page.js files, or `NavBarNames.jsx`.

---

## 2026-06-07 — Remove unused `ParagraphRenderBasedOnStringProperty`

### What was changed and why

Deleted dead component — zero imports; description text lives in `ContentListing`.

### Files removed

- `components/ShowingListOfContent/ParagraphRenderBasedOnStringProperty.tsx`
- `docs/notes/components/paragraph-render.md`

### Files modified

- `docs/notes/context/admin-context.md`
- `docs/README.md`

---

## 2026-06-07 — TypeScript: NavBar + layout wrappers

### What was changed and why

Converted primary header (mobile + desktop nav, profile menu) and four layout client wrappers to TypeScript. `NavBarLink` now uses `usePathname()` instead of broken `router.pathname` (App Router). Removed dead imports from nav modules. Renamed `AddItemsDropDownMenu` default export to match filename.

### Files created

- `components/NavBar/NavLayoutwithSettingsMenu.tsx`
- `components/NavBar/NavBarPieces/NavBarLink.tsx`
- `components/NavBar/NavBarPieces/DesktopNavBar/NavBarNames.tsx`
- `components/NavBar/NavBarPieces/DesktopNavBar/AddItemsDropDownMenu.tsx`
- `components/NavBar/NavBarPieces/DesktopNavBar/FetchDropDownMenu.tsx`
- `components/NavBar/NavBarPieces/MobileNavBar/MobileNavBar.tsx`
- `wrappers/SessionProviderWrapper.tsx`
- `wrappers/ToastWrapper.tsx`
- `wrappers/ReportsWrapper.tsx`
- `wrappers/SuggestionsWrapper.tsx`
- `docs/notes/components/navbar.md`
- `docs/notes/wrappers/layout-wrappers.md`

### Files removed

- All corresponding `.js` / `.jsx` in `components/NavBar/` and the four wrapper files above

### Files modified

- `docs/README.md`
- `docs/notes/app/root-layout.md`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `(admin)/layout.jsx` + admin pages, landing (`app/page.js`, `HeroTop.jsx`), or `(protected)/layout.jsx`.

---

## 2026-06-07 — TypeScript: admin routes, landing page, protected layout

### What was changed and why

Converted the admin route group (layout + four category/tag forms), public landing page (`app/page` + `HeroTop`), and protected route-group layout to TypeScript. Added `.d.ts` stubs for `MediaObjectLeft` / `MediaObjectRight` so landing sections type-check without converting those JSX components yet.

### Files created

- `app/(admin)/layout.tsx`
- `app/(admin)/addnamecategory/page.tsx`
- `app/(admin)/adddescriptioncategory/page.tsx`
- `app/(admin)/addnametag/page.tsx`
- `app/(admin)/adddescriptiontag/page.tsx`
- `app/(protected)/layout.tsx`
- `app/page.tsx`
- `components/LandingPage/HeroTop.tsx`
- `components/Shared/layout/MediaObjectLeft.d.ts`
- `components/Shared/layout/MediaObjectRight.d.ts`
- `docs/notes/app/admin-route-group.md`
- `docs/notes/app/landing-page.md`
- `docs/notes/app/protected-layout.md`

### Files removed

- `app/(admin)/layout.jsx`
- `app/(admin)/addnamecategory/page.js`
- `app/(admin)/adddescriptioncategory/page.js`
- `app/(admin)/addnametag/page.js`
- `app/(admin)/adddescriptiontag/page.js`
- `app/(protected)/layout.jsx`
- `app/page.js`
- `components/LandingPage/HeroTop.jsx`

### Files modified

- `docs/README.md`

### Problems encountered

- `app/page.tsx` failed `tsc` because inferred JSX props on `MediaObjectRight` required `credit` / `creditLink`. Fixed with optional props in `.d.ts` stubs (components still render correctly without credits).

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Convert `MediaObjectLeft` / `MediaObjectRight` to `.tsx` (replace `.d.ts`), then `Footer`, `about/page.jsx`, `(protected)/editsettings/page.js`, or remaining `app/api/**/*.js`.

---

## 2026-06-07 — TypeScript: MediaObject, Footer, about, editsettings

### What was changed and why

Converted landing marketing blocks (`MediaObjectLeft`/`Right`), site footer, about page, and edit-settings profile form to TypeScript. Replaced temporary `.d.ts` stubs with real `.tsx` modules. Fixed `FooterLink` to use `usePathname()` (App Router). Removed dead code and legacy `ProfileScreen.auth`.

### Files created

- `components/Shared/layout/MediaObjectLeft.tsx`
- `components/Shared/layout/MediaObjectRight.tsx`
- `components/Footer/Footer.tsx`
- `components/Footer/FooterLink.tsx`
- `app/about/page.tsx`
- `app/(protected)/editsettings/page.tsx`
- `docs/notes/components/media-object.md`
- `docs/notes/components/footer.md`
- `docs/notes/app/about-page.md`
- `docs/notes/app/editsettings-page.md`

### Files removed

- `components/Shared/layout/MediaObjectLeft.jsx`
- `components/Shared/layout/MediaObjectRight.jsx`
- `components/Shared/layout/MediaObjectLeft.d.ts`
- `components/Shared/layout/MediaObjectRight.d.ts`
- `components/Footer/Footer.jsx`
- `components/Footer/FooterLink.jsx`
- `app/about/page.jsx`
- `app/(protected)/editsettings/page.js`

### Files modified

- `docs/README.md`
- `docs/notes/app/landing-page.md`

### Problems encountered

- `Footer.tsx`: invalid `<h7>` elements failed `tsc`; replaced with `<h6>`.

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Remaining `app/api/**/*.js`, auth UI (`login`, `register`, `forgotpassword`), `ImageUpload`, or `LoadingScreen.jsx`.

---

## 2026-06-07 — TypeScript: remaining API routes, ImageUpload, LoadingScreen

### What was changed and why

Converted the last 19 `app/api/**/*.js` route handlers (auth, user profile, category/tag admin, forgot/verify reset password, legacy name route) plus `ImageUpload` and `LoadingScreen`. **`app/api` is now fully TypeScript.** Stripped large Pages Router comment blocks; added grouped API notes under `docs/notes/app/api/`.

### Files created

- 19 `app/api/**/route.ts` files (see git for full list)
- `app/api/auth/lib/mongodb.ts`
- `components/AddingNewData/ImageUpload.tsx`
- `components/LoadingScreen.tsx`
- `docs/notes/app/api/category-tag-routes.md`, `user-profile-routes.md`, `auth-session-refresh-route.md`, `auth-update-route.md`, `forgotpassword-route.md`, `verifyresetpasstoken-route.md`, `auth-mongodb.md`, `name-likes-content-route.md`
- `docs/notes/components/image-upload.md`, `loading-screen.md`

### Files removed

- All corresponding `.js` / `.jsx` listed above (zero `app/api/**/*.js` remain)

### Files modified

- `docs/README.md`
- `docs/notes/lib/auth.md`

### Problems encountered

- `auth/update`: narrowed `getSessionForApis` union before accessing `session`.
- `forgotpassword`: `resetTokenExpires` typed as `Date` on User model.
- `names/likes/[contentId]`: GET used wrong param name (`id` → `contentId`); fixed bug from JS original.
- Removed invalid `onClick` on `DisabledButton` in ImageUpload (prop not supported).

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Auth UI pages (`login`, `register`, `forgotpassword`, `ResetPassword`, `magiclink`), `EditBioAndProfile.jsx`, or enable `strict: true` once remaining `components/**/*.jsx` are converted.

---

## 2026-06-07 — Docs: NextAuth App Router route note

### What was changed and why

Preserved the original `[...nextauth]` comment explaining why the route exports `NextAuth` as GET/POST instead of separate route logic. Placed in `docs/notes/lib/auth.md`; route file points to that section.

### Files modified

- `docs/notes/lib/auth.md`
- `app/api/auth/[...nextauth]/route.ts`
- `CHANGES.md`

---

## 2026-06-07 — TypeScript: auth UI pages

### What was changed and why

Converted login, register, forgot password, reset password, and magic link screens to TypeScript. Register form was already TS; only the page wrapper moved.

### Files created

- `components/login.tsx`, `forgotpassword.tsx`, `ResetPassword.tsx`
- `app/login/page.tsx`, `app/register/page.tsx`, `app/forgotpassword/page.tsx`
- `app/resetpassword/[token]/page.tsx`, `app/magiclink/page.tsx`
- `docs/notes/app/auth-pages.md`

### Files removed

- All corresponding `.js` / `.jsx` auth UI files

### Files modified

- `docs/README.md`

### Problems encountered

- `NounBlackCatIcon` no longer accepts `fill` prop — removed from login/magiclink.
- Fixed missing `redirect` import on reset password page; cleaned dead code in `ResetPassword`.

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Delete dead JS (`AddComment.js`, `removeDeletedContent.jsx`, etc.) or enable `strict: true`.

---

## 2026-06-07 — Auth UI: restore section skim comments

Re-added `{/* <!-- … --> */}` / banner section comments in `login.tsx`, `forgotpassword.tsx`, `ResetPassword.tsx`, and `magiclink/page.tsx` for easier navigation.

## 2026-06-07 — Auth UI: preserve behavioral notes

Expanded `docs/notes/app/auth-pages.md` with implementation notes per `preserving-migration-notes.md`. Re-added short inline `//` comments in auth `.tsx` files (useSession timing, `redirect: false`, honeypot, forgot-password enumeration safety).

---

## 2026-06-07 — TypeScript: profile/dashboard polish, error pages, meta routes

### What was changed and why

Converted ranking/points UI, profile edit modal, error pages, robots/sitemap routes, and stub `fetchusers` / `test` pages to TypeScript.

### Files created

- `components/EditingData/EditBioAndProfile.tsx`
- `components/Ranking/PointSystemList.tsx`, `RankingTotals.tsx`, `RankNames.tsx`
- `components/Contact/ErrorContactMessage.tsx`
- `app/not-found.tsx`, `app/global-error.tsx`
- `app/robots.txt/route.ts`, `app/sitemap.xml/route.ts`
- `app/fetchusers/page.tsx`, `app/test/page.tsx`
- Docs under `docs/notes/components/` and `docs/notes/app/`

### Files removed

- All corresponding `.js` / `.jsx` for the above

### Files modified

- `components/profile.tsx` — pass real `setShowProfileEditPage` / `setProfileChange` setters (fix close/save toggling bug); guard modal with `session`
- `docs/README.md`, `docs/notes/components/profile.md`

### Problems encountered

- `global-error` now includes required `<html>` / `<body>` wrapper per Next.js App Router.
- `RankNames` simplified to `{ points: number }` (same math as old `Object.values` hack).

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

Auth UI (`login`, `register`, `forgotpassword`, `ResetPassword`, `magiclink`) or delete dead JS (`AddComment.js`, `removeDeletedContent.jsx`, etc.).

---

## 2026-06-07 — `strict: true` + migration cleanup fixes

### What was built and why

Enabled full TypeScript strict mode now that app/components/hooks are converted. Fixed ~21 strict errors (mongoose model generics, SWR mutate signatures, react-select typing, form validators, module stubs) and aligned hook generics for edit/delete flows.

### Files created

- `types/modules.d.ts` — ambient declarations for `react-google-recaptcha` and `mongoose-unique-validator`

### Files modified

- `tsconfig.json` — `strict: true`
- `utils/api/getPaginatedNotifications.ts` — generic `Model<TDoc extends Document>`
- `hooks/useEditHandler.ts`, `hooks/useDeleteConfirmation.ts`, `hooks/useSwrPagination.ts` — optional SWR `mutate` updater; generic page/item types
- `components/CoreListingPagesLogic.tsx` — optional `reset` default on `handleApplyFilters`
- `components/ShowingListOfContent/ContentListing.tsx` — typed edit/delete/mutate wiring; explicit `ToggeableAlert` generics
- `components/Shared/feedback/ToggeableAlert.tsx` — generic dismiss state
- `components/FormComponents/StyledSelect.tsx` — typed dynamic `react-select` import
- `components/Suggestions/SuggestionButton.tsx` — `SuggestionContentInfo` props
- `components/Register/RegisterForm.tsx`, `components/Contact/ContactForm.tsx` — reCAPTCHA + validate callback types
- `components/EmailTemplates/EmailTemplateComponents/email-button.tsx` — typed props

### Problems encountered

- `ToggeableAlert` generic inference narrowed `boolean` to literal `true` inside `{flag && <Alert …>}` — fixed with explicit `<ToggeableAlert<boolean>>`.
- `StyledSelect` `StylesConfig<…, true>` forced `isMulti` literal — widened to `boolean`.

### Verification

- `pnpm exec tsc --noEmit` — OK (`strict: true`)
- `pnpm build` — OK

### Docs

- `docs/notes/typescript/strict-mode-fixes.md` — all 21 strict errors with messages, before/after code, and rationale
- `docs/README.md` — index link added

### TODOs / next logical step

- Consider `moduleResolution: "bundler"`.

---

## 2026-06-07 — Legacy JS cleanup verification + `tsconfig` include tighten

### What was built and why

Confirmed the stale-JS cleanup pass: `app/`, `components/`, `hooks/`, `context/`, `wrappers/`, `lib/`, `models/`, and `app/api/` have **no** `.js`/`.jsx` on disk or in git (only TypeScript). Dead files (`useOnScreen.js`, `removeDeletedContent.jsx`, empty `AddComment.js`, commented `addingCategory.jsx`, superseded `AddDescriptionCategory.jsx`) were already removed in commit `67e5d13`. Tightened `tsconfig.json` `include` so TypeScript no longer scans wildcard `**/*.js` / `**/*.jsx` for app code — only `migrations/`, `codemods/`, `scripts/`, and root `*.config.js` remain JS in the repo (29 files).

### Files modified

- `tsconfig.json` — replaced `**/*.js` / `**/*.jsx` with explicit migration/codemod/script/config globs

### Verification

- Repo scan: **0** stale JS/JSX twins (no basename with both `.ts(x)` and `.js(x)`)
- `git ls-files "*.js" "*.jsx"` — 29 files (migrations, codemods, config only)
- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

### Next logical step

- Optional: convert `next.config.js` / Tailwind / PostCSS to `.ts` or `.mjs` if you want zero root `.js` in `include`.

---

## 2026-06-07 — Jest → Vitest migration

### What was built and why

Replaced Jest with Vitest for unit/component tests. Vitest aligns better with the Vite/ESM toolchain and is a natural fit for a Next 15 + TypeScript codebase. Playwright E2E unchanged.

### Files created

- `vitest.config.ts` — jsdom default, path aliases, excludes `e2e/` and migration folders
- `vitest.setup.ts` — `@testing-library/jest-dom/vitest` + TextEncoder polyfill
- `vitest.env.d.ts` — `vitest/globals` types for `describe` / `it` / `vi`
- `docs/notes/vitest-setup.md`

### Files removed

- `jest.config.ts`, `jest.setup.ts`, `docs/notes/jest-setup.md`

### Files modified

- `package.json` — `vitest`, `@vitejs/plugin-react`, `jsdom`, `@vitest/coverage-v8`; removed `jest`, `jest-environment-jsdom`, `@types/jest`; scripts `test` / `test:watch` / `test:ci`
- `tsconfig.json` — include `vitest.env.d.ts`
- `utils/debounce.test.ts`, `utils/startCooldown.test.ts`, `utils/api/rateLimiter.test.ts`, `utils/stringManipulation/findNormalizedMatch.test.ts` — `jest.*` → `vi.*`
- `utils/mongoDataCleanup.test.ts` — `@vitest-environment node`
- `TESTING.md`, `docs/README.md`

### Verification

- `pnpm install` — OK
- `pnpm test` — OK (20 files, 111 tests)
- `pnpm exec tsc --noEmit` — OK
- `pnpm build` — OK

---

## 2026-06-07 — First RTL batch + API auth guard tests

### What was built and why

Started the testing improvement plan: React Testing Library for leaf alert components, Vitest unit tests for `checkOwnership` / `checkIfAdmin` (high-risk API guards with no prior coverage).

### Files created

- `components/Shared/feedback/WarningMessage.test.tsx`
- `components/Shared/feedback/ToggeableAlert.test.tsx`
- `utils/api/checkOwnership.test.ts`
- `utils/api/checkIfAdmin.test.ts`

### Patterns

- RTL: `userEvent` + small `useState` harnesses for dismiss behavior
- API guards: `vi.hoisted` mock of `getSessionForApis` so tests do not import `lib/auth` / require `MONGODB_URI`

### Problems encountered

**`checkOwnership` / `checkIfAdmin` — `MONGODB_URI not defined`**

Importing `getSessionForApis` in the test file still loaded the real module → `lib/auth` → `utils/db` → throws without `MONGODB_URI`.

Failed approach:

```ts
import { getSessionForApis } from "./getSessionForApis";
vi.mock("./getSessionForApis");
// vi.mocked(getSessionForApis) still evaluates real module graph
```

Fix — `vi.hoisted` mock before imports:

```ts
const mocks = vi.hoisted(() => ({
  getSessionForApis: vi.fn(),
}));

vi.mock("./getSessionForApis", () => ({
  getSessionForApis: mocks.getSessionForApis,
}));

import { checkOwnership } from "./checkOwnership";

mocks.getSessionForApis.mockResolvedValue({
  ok: true,
  session: {
    user: { id: "creator-42", role: "user", status: "active" },
    expires: "…",
  },
});
```

### Files modified

- `TESTING.md` — unit/component coverage table

### Verification

- `pnpm test` — OK (24 files, 126 tests)

### Next logical step

- `MustLoginMessage`, `StyledCheckbox`, `PreserveTextAfterSubmission` (more leaf RTL)
- `CheckIfContentExists` with mocked `fetch`

---

## 2026-06-07 — Second RTL batch (forms, gate, duplicate check)

### What was built and why

Continued RTL expansion: sign-in gate, checkbox components, and duplicate-check UI with mocked `fetch`. Added global `matchMedia` stub in `vitest.setup.ts` for `LoadingSpinner` during async check tests.

### Files created

- `components/Shared/feedback/MustLoginMessage.test.tsx`
- `components/FormComponents/StyledCheckbox.test.tsx`
- `components/AddingNewData/preserveTextAfterSubmission.test.tsx`
- `components/AddingNewData/CheckIfContentExists.test.tsx`

### Files modified

- `vitest.setup.ts` — `window.matchMedia` stub (guarded for jsdom only)
- `docs/notes/vitest-setup.md`, `TESTING.md`

### Patterns

- `CheckIfContentExists` test harness restores parent `value` after child mount reset effect
- `ContentListing` mocked to a stub for show-content flow
- `vi.stubGlobal("fetch", …)` per test file

### Problems encountered

#### 1. `CheckIfContentExists` — duplicate/success messages never appeared

On mount, `resetData("")` runs via `resetTrigger` effect and clears parent `value` through `onChange`. Search stays disabled when `contentCheck.length < 2`.

Source (`CheckIfContentExists.tsx`):

```ts
useEffect(() => {
  resetData(""); // calls parent onChange("") on mount
}, [resetTrigger]);
```

Failed approach:

```ts
const [value, setValue] = useState(initial); // initial = "fluffy"
// after child mount effect → value becomes ""
```

Fix (`CheckIfContentExists.test.tsx` harness):

```ts
const [value, setValue] = useState("");

// Child resets parent value on mount; restore query text
useEffect(() => {
  setValue(initial);
}, [initial]);
```

#### 2. `window.matchMedia is not a function`

Search → `checkIsProcessing` → `LoadingSpinner` → `usePrefersReducedMotions` → `window.matchMedia` (missing in jsdom).

```
TypeError: window.matchMedia is not a function
❯ hooks/usePrefersReducedMotions.ts
```

Fix (`vitest.setup.ts`):

```ts
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
```

Without `typeof window !== "undefined"`, node-env suites fail:

```
ReferenceError: window is not defined
❯ vitest.setup.ts (mongoDataCleanup.test.ts, @vitest-environment node)
```

#### 3. `StyledCheckbox` — `onChange` `target.checked` assertion failed

Failed approach:

```ts
const onChange = vi.fn();
render(
  <StyledCheckbox
    label="Keep text"
    value="keep-text"
    checked={false}
    onChange={onChange}
  />
);
await user.click(screen.getByRole("checkbox", { name: /keep text/i }));
expect(onChange.mock.calls[0][0].target.checked).toBe(true); // got false
```

Fix — controlled wrapper + `toBeChecked()`:

```tsx
function ControlledCheckbox(props) {
  const [checked, setChecked] = useState(false);
  return (
    <StyledCheckbox
      {...props}
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    />
  );
}

render(<ControlledCheckbox label="Keep text" value="keep-text" />);
const checkbox = screen.getByRole("checkbox", { name: /keep text/i });
expect(checkbox).not.toBeChecked();
await user.click(checkbox);
expect(checkbox).toBeChecked();
```

### Verification

- `pnpm test` — OK (28 files, 141 tests)

### Next logical step

- `RegisterForm` client validation (mock reCAPTCHA)
- Thanks notifications E2E (still no Playwright coverage)

---

## 2026-06-07 — `RegisterForm` RTL tests

### What was built and why

Client-side validation and server error mapping for the register form — fills the gap between `validateSignupSubmission` unit tests and Playwright duplicate-email E2E.

### Files created

- `components/Register/RegisterForm.test.tsx`

### Files modified

- `TESTING.md` — Register form row in coverage table

### Patterns

- Mock stack: `next/image`, `next/navigation`, `next-auth/react`, reCAPTCHA v2/v3, `isE2eClientMode` (captcha bypass), `axios` via `vi.hoisted`
- `fillRegisterForm` / `submitRegister` helpers for repeated form interaction
- `form.noValidate = true` before submit so HTML5 `type="email"` does not block react-hook-form pattern errors in jsdom

### Problems encountered

**HTML5 email validation blocked RHF pattern test**

`type="email"` + `not-an-email` prevented form submit in jsdom; `handleSubmit` never ran, so "Please enter a valid email" never rendered.

Fix:

```ts
async function submitRegister(user) {
  const form = document.querySelector("form");
  if (form) form.noValidate = true;
  await user.click(screen.getByRole("button", { name: /register/i }));
}
```

### Verification

- `pnpm test` — OK (29 files, 147 tests)

### Next logical step

- Thanks notifications E2E (`e2e/notifications.spec.ts` extension or new spec)
- `RegisterInput` leaf tests (optional; mostly covered via `RegisterForm`)

---

## 2026-06-07 — Thanks notifications E2E

### What was built and why

Extended Playwright notification coverage for the thanks flow — previously only the unauthenticated 401 on `/api/notifications/thanks` was tested.

### Files created

- `e2e/helpers/thanks.ts` — `submitThanks`, `expectSelfThankRejected`

### Files modified

- `e2e/notifications.spec.ts` — thank populate (name + description), self-thank 400, `PATCH .../thanks/mark-read`
- `TESTING.md` — E2E coverage list + manual checklist note

### Patterns

- Serial suite with like tests: admin submits thanks → regular user reads `/api/notifications/thanks`
- Seeded `SEED_NAME` / `SEED_DESCRIPTION_START` (owned by playwright user) + admin as thanker
- Mark-read test skips if no thank rows (same pattern as names mark-read)

### Verification

- `pnpm test` — OK (unit/component unchanged, 147 tests)
- `pnpm test:e2e` — requires `MONGODB_URI_TEST` + seed; run locally against test DB

### Next logical step

- `/notifications` UI thanks tab (Playwright browser assertions)
- Description/thanks `mark-read` UI persistence on `/notifications` page

---

## 2026-06-07 — Notifications thanks tab UI E2E

### What was built and why

Browser-level coverage for `/notifications` Thanks tab — populated rows and the 3s mark-read badge clear that the API-only tests could not assert.

### Files created

- `e2e/notifications-ui.spec.ts` — thanks tab rows (name + description), unread badge clears after tab stays open
- `e2e/helpers/notifications-ui.ts` — `gotoNotificationsPage`, `openThanksTab`, `thanksUnreadBadge`, `leaveThanksTabBeforeMarkRead`

### Files modified

- `TESTING.md` — E2E coverage + manual checklist (thanks UI covered; descriptions tab UI still manual)

### Patterns

- Serial suite: name row test leaves Thanks tab before 3s timer so mark-read test still has unread badge
- Row locator: filter `div` by `thanked you` + content text; assert admin display name + default thank message
- Description row uses `SEED_DESCRIPTION_START.slice(0, 60) + "..."` to match `ThankNotificationListing` truncation
- Mark-read UI: `expect.poll` on badge count after `openThanksTab` + 3s client timer (`test.setTimeout(60_000)`)

### Verification

- `pnpm test` — OK (147 unit/component tests)
- `pnpm test:e2e e2e/notifications-ui.spec.ts` — requires `MONGODB_URI_TEST` + seed

### Next logical step

- `/notifications` descriptions tab UI rows
- Names tab mark-read badge UI (API mark-read already covered)

---

## 2026-06-07 — Component folder reorg (`Shared/`)

### What was built and why

Replaced size-based `ReusableSmallComponents/` and `ReusableMediumComponents/` with purpose-based `components/Shared/` so new contributors know where generic UI lives.

### Files created

- [`components/README.md`](components/README.md) — “where to put new code” decision guide
- `components/Shared/{actions,feedback,icons,typography,media,lists,layout,content-actions}/` — 33 moved components + tests

### Files removed

- `components/ReusableSmallComponents/` (entire tree)
- `components/ReusableMediumComponents/` (entire tree)

### Files modified

- ~74 source/doc files — import paths updated to `@components/Shared/...`
- [`docs/README.md`](docs/README.md), [`reusable-buttons.md`](docs/notes/components/reusable-buttons.md), [`reusable-small-components.md`](docs/notes/components/reusable-small-components.md)
- [`TESTING.md`](TESTING.md) — test file paths in coverage table

### Mapping

| Old                                                       | New                       |
| --------------------------------------------------------- | ------------------------- |
| `ReusableSmallComponents/buttons/*` (generic)             | `shared/actions/`         |
| `WarningMessage`, `ToggeableAlert`, `ui/MustLoginMessage` | `shared/feedback/`        |
| icons, `IconWithCount`                                    | `shared/icons/`           |
| headings                                                  | `shared/typography/`      |
| `ProfileImage`, `GifHover`, `ShowTime`                    | `shared/media/`           |
| `ListWithPawPrintIcon`                                    | `shared/lists/`           |
| `MediaObject*`                                            | `shared/layout/`          |
| like/follow/share                                         | `shared/content-actions/` |

### Problems encountered

- **`iconOpenCloseButton`** relative import `../IconWithCount` broke after move → `../icons/IconWithCount`
- **`EditSuggestion`** still imported `../ui/MustLoginMessage` after `MustLoginMessage` moved to `shared/feedback/`

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm test` — OK (29 files, 147 tests)

### Next logical step

- Optional naming cleanup: `IconWithCount.tsx` → `IconBadge.tsx`, `ToggeableAlert` → `ToggleableAlert`

---

## 2026-06-07 — Move `components/ui/` into `Shared/ui/`

### What was built and why

`LoadingSpinner` and `skeleton` are app-wide shared primitives — nesting them under `Shared/ui/` matches the rest of the `shared/` taxonomy.

### Files moved

- `components/ui/LoadingSpinner.tsx` → `components/Shared/ui/LoadingSpinner.tsx`
- `components/ui/skeleton.tsx` + `skeleton.test.tsx` → `components/Shared/ui/`

### Files modified

- ~16 import sites (`@components/Shared/ui/...`, `../Shared/ui/...`)
- [`components/README.md`](components/README.md) — decision table + tree
- [`components.json`](components.json) — shadcn `ui` alias → `@/components/Shared/ui`
- [`docs/README.md`](docs/README.md), [`small-ui-components.md`](docs/notes/components/ui/small-ui-components.md), [`TESTING.md`](TESTING.md)

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm test` — OK (29 files, 147 tests)

---

## 2026-06-07 — PascalCase `Footer/` and `Shared/` folder names

### What was built and why

Top-level component folders now match the repo convention (`Notifications/`, `FormComponents/`). Category subfolders inside `Shared/` stay lowercase (`actions/`, `ui/`).

### Renamed

- `components/footer/` → `components/Footer/`
- `components/shared/` → `components/Shared/`

### Files modified

- ~75 import and doc path updates (`@components/Shared/...`, `@/components/Footer/...`)
- [`components/README.md`](components/README.md) — folder naming rule + PascalCase links
- [`components.json`](components.json), [`TESTING.md`](TESTING.md), docs index

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm test` — OK (29 files, 147 tests)

---

## 2026-06-07 — Likes server prefetch (Option B)

### What was built and why

Signed-in users saw wrong heart state until client `GET /api/user/likes` finished. Root layout now prefetches likes and seeds `LikesProvider` on first paint (see `docs/FUTURE.md` Option B).

### Files created

- `utils/api/getUserLikes.ts` — `getUserLikesForUserId`
- `utils/api/userLikesResponse.ts` — types + `buildLikesMapsFromResponse`
- `utils/api/getUserLikes.test.ts` — map builder unit tests

### Files modified

- `app/api/user/likes/route.ts` — thin handler; delegates to `getUserLikesForUserId`
- `context/LikesContext.tsx` — optional `initialLikes`; skip first client fetch when server-seeded
- `wrappers/LikesWrapper.tsx` — passes `initialLikes` prop
- `app/layout.tsx` — prefetch when session has user id
- `docs/notes/app/api/user-likes-route.md`, `docs/notes/app/root-layout.md`, `docs/FUTURE.md`, `docs/README.md`

### Patterns

- One fetch helper for API route + server layout (same shape as `UserLikesResponse`)
- Client fetch still runs after client-only login; toggles still use `addLike` / `deleteLike`
- No page-level `NameLikes` props on listing pages

### Verification

- `pnpm exec tsc --noEmit` — OK
- `pnpm test` — OK (30 files, 149 tests)

### Next logical step

- Manual: signed-in listing page — hearts correct on first paint without flash

---

## 2026-06-07 — Restore LikesContext inline comments

### What changed

Re-added explanatory comments removed during likes prefetch refactor: `recentLikesRef` session deltas, logout reset, SSR skip-fetch, AbortController/magic-link note, legacy `getLikeStatus` sketch, usage examples at file bottom. Updated bottom example to current `addLike("names", contentId)` signature.

### Files modified

- `context/LikesContext.tsx`
- `utils/api/getUserLikes.ts` — parallel query comment
- `app/api/user/likes/route.ts` — session comment

---

## 2026-06-07 — RTL batch: LikesContext, ShowTime, ListWithPawPrintIcon

### What was built and why

Expanded Vitest coverage after likes server prefetch — context behavior, plus two untested shared components.

### Files created

- `context/LikesContext.test.tsx` — SSR hydrate, client fetch, add/delete, logout, post-login fetch
- `components/Shared/media/ShowTime.test.tsx` — mocked `Intl.DateTimeFormat`, styling
- `components/Shared/lists/ListWithPawPrintIcon.test.tsx` — text + `className`

### Patterns

- `LikesContext` stores state in refs — tests use `LikesCapture` + imperative `hasLiked` / `getLikedIds`, and `LikesPoll` for async fetch (no re-render on ref mutation)
- `vi.hoisted` mock of `useSession`; `fetch` stubbed globally
- `ShowTime` — mock `Intl.DateTimeFormat` to avoid locale flakiness

### Verification

- `pnpm test` — OK (33 files, 159 tests)

### Next logical step

- `useLikeState` hook tests (mock `useLikes` + toggle API)
- E2E: descriptions tab UI on `/notifications`

---

## 2026-06-07 — useLikeState, GeneralButton tests + descriptions tab E2E

### What was built and why

Follow-up testing batch: like toggle optimistic logic, primary button component, descriptions notifications UI.

### Files created

- `hooks/useLikeState.test.ts` — count + `addLike`/`deleteLike` via mocked `useToggleState`
- `components/Shared/actions/GeneralButton.test.tsx` — click, disabled, aria-label, children, warning variant

### Files modified

- `e2e/helpers/notifications-ui.ts` — `openDescriptionsTab`, `descriptionsTabButton`
- `e2e/notifications-ui.spec.ts` — descriptions tab like row after admin like
- `TESTING.md` — coverage table + E2E list; descriptions tab removed from manual checklist

### Patterns

- `useLikeState` tests capture `onApplyOptimistic` / `onRollback` from mocked `useToggleState` (avoids debounce/fetch)
- Descriptions UI row locator: `Liked •` + truncated `SEED_DESCRIPTION_START`

### Verification

- `pnpm test` — OK (35 files, 168 tests)
- `pnpm test:e2e e2e/notifications-ui.spec.ts` — requires `MONGODB_URI_TEST` + seed

### Next logical step

- Names tab UI row on `/notifications` (API already covered)
- `useToggleState` unit tests with fake timers + mocked fetch

---

## 2026-06-07 — Fix notifications UI E2E strict mode (duplicate rows)

### Problem

Serial `notifications-ui.spec.ts` reruns append thank/like rows to the test DB. `row.getByText('E2E Admin')` matched **two** description thank rows → Playwright strict mode violation.

### Fix

`notificationRow()` helper uses `.first()` on filtered rows; assertions use `toContainText` on that single row.

### Files modified

- `e2e/helpers/notifications-ui.ts` — `notificationRow`
- `e2e/notifications-ui.spec.ts` — all row assertions
- `TESTING.md` — duplicate-row / strict-mode note under `notifications-ui.spec.ts`

### Next logical step

- `useToggleState` unit tests with fake timers + mocked fetch
- `/notifications` UI — names tab mark-read badge (API covered)

---

## 2026-06-07 — Names tab UI E2E (`notifications-ui.spec.ts`)

### What was built and why

Browser assertion for name like notifications — API was covered in `notifications.spec.ts`; names tab is the SSR default on `/notifications` so no tab click is required.

### Files modified

- `e2e/notifications-ui.spec.ts` — admin like on `SEED_NAME` → user sees `Liked •` row
- `e2e/helpers/notifications-ui.ts` — `namesTabButton`, `openNamesTab` (for future tab-switch tests)
- `TESTING.md` — E2E coverage bullet

### Verification

- `pnpm test:e2e e2e/notifications-ui.spec.ts` — requires `MONGODB_URI_TEST` + seed

---

## 2026-06-07 — `useToggleState` unit tests + names tab mark-read E2E

### What was built and why

- **`hooks/useToggleState.test.ts`** — covers optimistic flip, debounced POST, `onApplyOptimistic` / `onRollback`, rate-limit skip, and in-flight toggle guard. Mocks `useApiRateLimiter`; fake timers for 500ms debounce; absolute `apiUrl` so unmount `flush` does not hit invalid relative URLs in Node.
- **Names tab mark-read UI** — mirrors thanks-tab badge test; names tab is SSR default so no tab click needed.

### Files created / modified

- `hooks/useToggleState.test.ts` (new)
- `e2e/notifications-ui.spec.ts` — names tab mark-read test
- `e2e/helpers/notifications-ui.ts` — `namesUnreadBadge`
- `TESTING.md` — coverage bullets

### Verification

- `pnpm test hooks/useToggleState.test.ts` — 6 passed
- `pnpm test:e2e e2e/notifications-ui.spec.ts` — run locally with seed

### Next logical step

- `/notifications` UI — mark read persists after reload (manual checklist item)
- Optional: `useApiRateLimiter` unit tests

---

## 2026-06-08 — `useApiRateLimiter` tests + mark-read persists after reload

### What was built and why

- **`hooks/useApiRateLimiter.test.ts`** — limit enforcement, window reset via `setInterval`, default options.
- **Mark-read persist** — thanks and names mark-read E2E tests now reload `/notifications` after badge clears and assert badge stays absent (DB `read: true` survives refetch).
- **`reloadNotificationsPage`** helper waits for `GET /api/user/notifications` after reload.

### Files created / modified

- `hooks/useApiRateLimiter.test.ts` (new)
- `e2e/helpers/notifications-ui.ts` — `reloadNotificationsPage`
- `e2e/notifications-ui.spec.ts` — persist assertions on thanks + names mark-read tests
- `TESTING.md` — coverage + checklist updates

### Verification

- `pnpm test hooks/useApiRateLimiter.test.ts` — 4 passed
- `pnpm test:e2e e2e/notifications-ui.spec.ts` — run locally with seed

### Next logical step

- Like toggle on name detail UI — rapid double-click E2E

---

## 2026-06-08 — Descriptions tab mark-read (API + UI E2E)

### What was built and why

Completes the notifications tab trilogy: thanks and names already had mark-read UI + persist-after-reload; descriptions had list UI only, no `PATCH descriptions/mark-read` API test.

### Files modified

- `e2e/helpers/notifications-ui.ts` — `descriptionsUnreadBadge`, `leaveDescriptionsTabBeforeMarkRead`
- `e2e/notifications-ui.spec.ts` — mark-read + reload persist test; descriptions like row leaves tab before timer
- `e2e/notifications.spec.ts` — `PATCH /api/notifications/descriptions/mark-read`
- `TESTING.md` — API + UI coverage bullets

### Verification

- `pnpm exec playwright test e2e/notifications-ui.spec.ts e2e/notifications.spec.ts --list` — 16 tests listed
- `pnpm test:e2e e2e/notifications-ui.spec.ts` — run locally with seed

### Next logical step

- Follow / unfollow via FollowButton UI

---

## 2026-06-08 — Fix like double-click E2E (OS dblclick interval)

### Problem

`likeButton.dblclick()` used the OS double-click gap (~500ms), matching `useToggleState` debounce — two separate `togglelike` POSTs.

### Fix

`rapidDoubleClick()` in `e2e/helpers/likes.ts` — two `mouse.click` calls at button center with no intentional delay.

---

## 2026-06-08 — Name detail like double-click E2E (`social.spec.ts`)

### What was built and why

Browser test for debounced `togglelike` on `/name/[name]`: rapid double-click sends one POST after 500ms debounce, no 5xx, like count changes by at most 1.

### Files modified

- `e2e/helpers/likes.ts` — `ensureNameUnliked`, `nameDetailLikeButton`
- `e2e/social.spec.ts` — double-click debounce test (admin, seeded name)
- `TESTING.md` — `social.spec` bullet + manual checklist note

### Verification

- `pnpm exec playwright test e2e/social.spec.ts --list` — 5 tests listed
- `pnpm test:e2e e2e/social.spec.ts` — run locally with seed

### Next logical step

- Follow / unfollow via FollowButton UI

---

## 2026-06-08 — Like debounce docs + settle-then-POST tests

### What was built and why

Documented and tested the existing client contract: optimistic UI on every click, one `togglelike` POST 500ms after the user stops clicking. No Option C click-blocking.

### Files modified

- `docs/notes/app/api/togglelike-route.md` — mermaid sequence diagram, lockout table, edge cases, stack, test index
- `hooks/useToggleState.ts` — client contract comment block
- `hooks/useToggleState.test.ts` — burst coalescing, like-then-unlike before settle, separate bursts
- `e2e/social.spec.ts` — like → pause 200ms → unlike → one POST E2E
- `TESTING.md` — social.spec bullets + checklist link to togglelike doc

### Verification

- `pnpm test hooks/useToggleState.test.ts` — 9 passed
- `pnpm exec playwright test e2e/social.spec.ts --list` — 6 tests listed

### Next logical step

- Follow / unfollow via FollowButton UI

---

## 2026-06-08 — Fix useToggleState flush on every optimistic re-render

### Problem

`useEffect` for `beforeunload` / unmount flush listed `canSend` in deps. `useApiRateLimiter` recreates `canSend` every render, so each `setActive` from a like click ran effect cleanup → `debouncedCommit.flush()` → immediate POST. Like → unlike within 500ms sent **two** POSTs instead of one.

### Fix

- `canSendRef` / `registerSendRef` for stable reads inside debounce and flush
- Flush effect deps: `[debouncedCommit]` only
- Unit test: rerender after toggle → still one POST
- E2E: `likeThenUnlikeWithinDebounce` helper (mouse clicks)

### Files modified

- `hooks/useToggleState.ts`
- `hooks/useToggleState.test.ts`
- `e2e/helpers/likes.ts`, `e2e/social.spec.ts`
- `docs/notes/app/api/togglelike-route.md`

---

## 2026-06-08 — togglelike doc: edge cases Handled? column

### What changed

[`docs/notes/app/api/togglelike-route.md`](docs/notes/app/api/togglelike-route.md) edge cases table now includes **Handled?** (Yes / Partial / No) for each scenario, plus rows for fetch rollback, tab close flush, and logged-out gate.

---

## 2026-06-08 — Like toggle rate limit (client + server)

### What was built and why

Harden like toggles against abuse without lying in the UI: **3 POSTs / 2 minutes** per user, shared preset on client and server. Client blocks clicks **before** optimistic UI and shows pagination-style “Please wait X secs”; server returns **429** + `retryAfterSeconds` if bypassed (multi-tab / direct API).

### Files created

- `utils/api/likeToggleRateLimit.ts` — `checkLikeToggleRateLimit`, `likeToggleRateLimitResponse`

### Files modified

- `utils/api/rateLimiter.ts` — `LIKE_TOGGLE_RATE_LIMIT`, `rateLimitPresets.likeToggle`
- `utils/api/rateLimiter.test.ts` — preset assertion
- `app/api/names/likes/[contentId]/togglelike/route.ts` — 429 after auth
- `app/api/description/likes/[contentId]/togglelike/route.ts` — 429 + `getSessionForApis({ req })` fix
- `hooks/useApiRateLimiter.ts` — sliding window, `remainingSeconds`, `applyServerCooldown`, `isRateLimited`
- `hooks/useApiRateLimiter.test.ts` — updated coverage
- `hooks/useToggleState.ts` — block before optimistic UI; 429 rollback + server cooldown
- `hooks/useToggleState.test.ts` — rate limit block, 429 rollback tests
- `hooks/useLikeState.ts` — pass through `isRateLimited`, `remainingSeconds`
- `components/Shared/content-actions/LikesButtonAndLikesLogic.tsx` — disabled + cooldown message
- `docs/notes/app/api/togglelike-route.md` — 429 section, edge case row, locked-vs-not table

### Patterns followed

- Same rate-limit UX as pagination (`useApiRateLimiter` + “Please wait X secs”)
- Shared `LIKE_TOGGLE_RATE_LIMIT` constant imported by client hook and server helper
- Rollback on 429 matches fetch-failure path (no `registerSend` on failed commit)

### Verification

- `pnpm test hooks/useApiRateLimiter.test.ts hooks/useToggleState.test.ts utils/api/rateLimiter.test.ts hooks/useLikeState.test.ts` — 26 passed
- `pnpm exec tsc --noEmit`

### Next logical step

- Follow / unfollow via FollowButton UI E2E

---

## 2026-06-08 — Fix social E2E like setup hitting togglelike rate limit

### Problem

Serial `social.spec.ts` tests share the in-memory server rate limiter (3 POSTs / 2 min per user). Test 6 failed in `ensureNameUnliked` with **429** after tests 1 and 5 consumed the admin quota. Helpers also blind-toggled (2 POSTs when already in target state).

### Fix

- [`e2e/helpers/likes.ts`](e2e/helpers/likes.ts) — `GET /api/user/likes` before setup; POST only when state must change
- [`utils/api/likeToggleRateLimit.ts`](utils/api/likeToggleRateLimit.ts) — relaxed cap (50 / 2 min) when `E2E_TEST_MODE`; production unchanged
- [`utils/api/e2eTestMode.ts`](utils/api/e2eTestMode.ts) — `isE2eServerMode()`

### Verification

- `pnpm test:e2e e2e/social.spec.ts`

### What changed

[`docs/notes/app/api/togglelike-route.md`](docs/notes/app/api/togglelike-route.md) — OS double-click at the debounce boundary is **Yes (acceptable)**, not a sync bug: two POSTs (like then unlike) leave UI and DB aligned; only an extra API call / rate-limit slot. Clarified that OS timing at ~500ms behaves like two intentional bursts.

### Files modified

- `docs/notes/app/api/togglelike-route.md`

---

## 2026-06-08 — E2E: togglelike 429 on 4th POST (production rate limit)

### What was built and why

Verify server **429** on the real `togglelike` route without breaking serial UI tests that use the relaxed E2E cap.

### Files created

- `app/api/test/e2e/reset-like-toggle-rate-limit/route.ts` — E2E-only; clears in-memory counter for signed-in user

### Files modified

- `utils/api/likeToggleRateLimit.ts` — `x-e2e-strict-like-rate-limit: 1` header applies production cap; `resetLikeToggleRateLimit`
- `app/api/names/likes/[contentId]/togglelike/route.ts`, `app/api/description/likes/[contentId]/togglelike/route.ts` — `checkLikeToggleRateLimitForRequest`
- `e2e/helpers/likes.ts` — `resetLikeToggleRateLimitForSession`, `postNameToggleLikeWithProductionRateLimit`
- `e2e/social.spec.ts` — 4 strict POSTs → `[200, 200, 200, 429]`
- `docs/notes/app/api/togglelike-route.md`, `TESTING.md`

### Verification

- `pnpm test:e2e e2e/social.spec.ts` — 7 passed

---

## 2026-06-08 — FUTURE.md: follow / unfollow UI E2E backlog

### What changed

Documented deferred Playwright coverage for `FollowButton` when profile follow/following modals are re-enabled. Cross-linked from `TESTING.md`, `updatefollows-route.md`, `docs/README.md`.

### Files modified

- `docs/FUTURE.md`
- `TESTING.md`
- `docs/notes/app/api/updatefollows-route.md`
- `docs/README.md`

---

## 2026-06-08 — Thanks flow UI E2E (`thanks-ui.spec.ts`)

### What was built and why

Playwright coverage for the full thanks UI path: `ThanksButton` → dialog → tag selection → `POST /api/thanks`, owner notification visibility, and self-thank button hidden on own content.

### Files created

- `e2e/thanks-ui.spec.ts`
- `e2e/helpers/thanks-ui.ts`

### Files modified

- `e2e/helpers/thanks.ts` — export `DEFAULT_THANK_MESSAGE`
- `components/Thanks/ThanksDialog.tsx` — backdrop `aria-hidden` no longer wraps `DialogPanel` (a11y + testability)
- `docs/notes/app/api/thanks-route.md` — tests table
- `TESTING.md`

### Verification

- `pnpm test:e2e e2e/thanks-ui.spec.ts` — 4 passed

### Next logical step

- Suggestion / report flows via UI E2E (if exposed on listing pages)

---

## 2026-06-08 — Unit tests: `getSessionForApis` + `lib/auth.ts`

### What was built and why

Smoke tests for the API session helper and NextAuth callbacks — closes the gap called out in `TESTING.md` for `lib/auth` without loading Mongo in consumers.

### Files created

- `utils/api/getSessionForApis.test.ts` — `getServerSession` mock; 401 vs ok; passes `serverAuthOptions`
- `lib/auth.test.ts` — `signIn`, `jwt`, `session` callbacks; credentials `authorize` (banned, password, success)

### Files modified

- `docs/notes/lib/auth.md` — test index
- `TESTING.md` — API auth guards row + migration checklist note

### Patterns followed

- `vi.hoisted` mocks for `getServerSession`, `User`, `db`, `bcryptjs` (same as `checkOwnership.test.ts`)
- `resolveSignInCallback` remains separately tested; `signIn` callback test asserts delegation

### Verification

- `pnpm test utils/api/getSessionForApis.test.ts lib/auth.test.ts` — 19 passed

### Next logical step

- Optional: integration test for `[...nextauth]` route (heavier; callbacks already covered)

---

## 2026-06-08 — Tier 2 tests (notifications context, moderation, detail smoke)

### What was built and why

Second testing tier from backlog: notification badge context, cooldown/suggestion/flagging hooks, moderation API E2E, and browse detail page smoke.

### Files created

- `context/notificationsContext.test.tsx`
- `hooks/useLocalStorageCooldown.test.ts`
- `hooks/useSuggest.test.ts`, `hooks/useFlagging.test.ts`
- `e2e/moderation.spec.ts`, `e2e/helpers/moderation.ts`

### Files modified

- `e2e/browse.spec.ts` — name/description detail render tests
- `TESTING.md`

### Verification

- `pnpm test context/notificationsContext.test.tsx hooks/useLocalStorageCooldown.test.ts hooks/useSuggest.test.ts hooks/useFlagging.test.ts` — 11 passed
- `pnpm test:e2e e2e/moderation.spec.ts e2e/browse.spec.ts` — 10 passed

### Next logical step (tier 2 remaining)

- _(completed in later 2026-06-08 entries)_

---

## 2026-06-08 — `useSwrSimple` unit tests

### What was built and why

Tier 2 item: unit coverage for the notifications infinite-SWR hook (`getKey`, page flattening, end-of-list detection) without hitting the network.

### Files created

- `hooks/useSwrSimple.test.ts`

### Files modified

- `TESTING.md`, `CHANGES.md`

### Patterns

- Mock `swr/infinite` via `vi.hoisted` (same pattern as `useLikeState.test.ts`)
- Capture `getKey` and options from the mock to assert URL building and `fallbackData`

### Verification

- `pnpm test hooks/useSwrSimple.test.ts` — 7 passed

---

## 2026-06-08 — Admin category UI E2E (`admin-category-ui.spec.ts`)

### What was built and why

Final tier 2 item: Playwright coverage for admin category creation through the UI forms (not only API smoke in `admin.spec.ts`).

### Files created

- `e2e/admin-category-ui.spec.ts`
- `e2e/helpers/admin-ui.ts`

### Files modified

- `TESTING.md`, `CHANGES.md`

### Notes

- `waitForAdminSession()` polls `/api/auth/session` so client `isAdmin` is true before asserting submit buttons.
- Direct `page.goto` to admin routes is more reliable than Admin dropdown navigation (menu click did not consistently route in Playwright).
- Tag create/edit UI still manual-only (`/addnametag`, etc.).

### Verification

- `pnpm test:e2e e2e/admin-category-ui.spec.ts` — 2 passed

### Next logical step

- Tier 3 / manual backlog per `TESTING.md` (description tag UI, edit category/tag UI, follow UI in `docs/FUTURE.md`)

---

## 2026-06-08 — Admin name tag UI E2E (add-on to `admin-category-ui.spec.ts`)

### What was built and why

Minimal admin tag-create coverage: `/addnametag` form → `POST /api/nametag` without exercising react-select category attach.

### Files modified

- `e2e/admin-category-ui.spec.ts` — third test
- `e2e/helpers/admin-ui.ts` — `submitNameTagForm`, `expectNameTagExists`
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test:e2e e2e/admin-category-ui.spec.ts` — 3 passed

### Next logical step

- Optional: tag + category attach via react-select; description tag UI

---

## 2026-06-08 — Fetchnames cooldown UI E2E (`fetchnames-cooldown.spec.ts`)

### What was built and why

Tier 2 item: Playwright coverage for sort (~3s), filter (~5s), and pagination (~15s) cooldown UX on `/fetchnames`.

### Files created

- `e2e/fetchnames-cooldown.spec.ts`
- `e2e/helpers/fetchnames-ui.ts`

### Files modified

- `TESTING.md`, `CHANGES.md`

### Notes

- Pagination cooldown test requires 51+ names (second SWR chunk preload). Skips on seed-only E2E DB (~2 names).
- Sort cooldown text lives in a disabled `<option>` — assert `toContainText` on the option, not page-visible text.

### Verification

- `pnpm test:e2e e2e/fetchnames-cooldown.spec.ts` — 2 passed, 1 skipped (pagination on seed DB)

---

## 2026-06-08 — Suggestion/report UI E2E (`moderation-ui.spec.ts`)

### What was built and why

Tier 2 remaining item: Playwright coverage for suggestion and report dialogs via the listing ⋮ menu (mirrors `thanks-ui.spec.ts` and `moderation.spec.ts` API flows).

### Files created

- `e2e/moderation-ui.spec.ts`
- `e2e/helpers/moderation-ui.ts`

### Files modified

- `components/Suggestions/SuggestionDialog.tsx` — Headless UI a11y fix (backdrop `aria-hidden` separate from `DialogPanel`); API path without trailing slash (`/api/suggestion`)
- `components/Flagging/FlagDialog.tsx` — same a11y fix; `/api/flag/flagreportsubmission` without trailing slash (avoids 308 redirect on POST)
- `TESTING.md`, `CHANGES.md`

### Problems encountered and fixes

- **308 on POST:** trailing-slash API URLs in dialogs caused permanent redirects; Playwright captured 308 instead of 201.
- **Admin menu:** admins see Delete/Edit on all content — report UI test uses regular user on admin-owned name (matches API test).
- **Idempotent pending:** prior runs leave pending suggestion/report; tests check API first and assert edit form, with reload retry if client context is stale.

### Verification

- `pnpm test:e2e e2e/moderation-ui.spec.ts` — 3 passed

---

## 2026-06-08 — Admin name tag UI E2E (add-on to `admin-category-ui.spec.ts`)

### What was built and why

Minimal admin tag-create coverage: `/addnametag` form → `POST /api/nametag` without react-select category attach.

### Files modified

- `e2e/admin-category-ui.spec.ts` — third test
- `e2e/helpers/admin-ui.ts` — `submitNameTagForm`, `expectNameTagExists`
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test:e2e e2e/admin-category-ui.spec.ts` — 3 passed

---

## 2026-06-08 — Admin description tag UI E2E (add-on)

### What was built and why

Symmetric coverage for `/adddescriptiontag` after name tag test.

### Files modified

- `e2e/admin-category-ui.spec.ts`, `e2e/helpers/admin-ui.ts`, `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test:e2e e2e/admin-category-ui.spec.ts` — 4 passed

---

## 2026-06-08 — Fetchdescriptions cooldown UI E2E (`fetchdescriptions-cooldown.spec.ts`)

### What was built and why

Mirror of `fetchnames-cooldown.spec.ts` for `/fetchdescriptions` (sort, filter, pagination cooldown UX).

### Files created

- `e2e/fetchdescriptions-cooldown.spec.ts`
- `e2e/helpers/fetchdescriptions-ui.ts`

### Files modified

- `TESTING.md`, `CHANGES.md`

### Notes

- Descriptions have no quick-filter buttons; filter test expands first category disclosure and checks a tag checkbox.
- Filter test skips when test DB has no description categories/tags (seed does not create them).
- Pagination cooldown skips when DB has &lt; 51 descriptions.

### Verification

- `pnpm test:e2e e2e/fetchdescriptions-cooldown.spec.ts` — 1 passed, 2 skipped on seed DB

---

## 2026-06-08 — E2E seed + listing cooldown tests (no skips)

### What was built and why

Extended `pnpm seed:e2e` so filter and pagination cooldown E2E tests run against real DB data instead of skipping. SWR fetches 50 items per chunk; seed targets 51+ docs so a second chunk is required. Pagination test clicks page 3 then **next** (not page 5) to avoid auto-preload on the last loaded page, which fetches chunk 2 without showing the 15s cooldown.

### Files modified

- `e2e/fixtures/seed-data.json` — `listingCooldown` block (bulk prefixes, filter category/tag, min 51 docs)
- `scripts/seed-e2e.mjs` — bulk names/descriptions, description tag + category
- `e2e/fixtures/seed-data.ts` — exports for filter + pagination constants
- `e2e/helpers/fetchdescriptions-ui.ts` — `applySeededDescriptionFilter`, `triggerPaginationCooldown` (page 3 + next)
- `e2e/helpers/fetchnames-ui.ts` — `triggerPaginationCooldown` (page 3 + next)
- `e2e/fetchdescriptions-cooldown.spec.ts`, `e2e/fetchnames-cooldown.spec.ts` — assert DB counts, no `test.skip`
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm seed:e2e` then `pnpm test:e2e e2e/fetchdescriptions-cooldown.spec.ts e2e/fetchnames-cooldown.spec.ts` — 6 passed

---

## 2026-06-08 — Admin tag + category attach E2E (react-select)

### What was built and why

Tier 3 backlog item: Playwright coverage for attaching a new tag to categories via `StyledSelect` on `/addnametag` and `/adddescriptiontag` (POST tag + PUT `edittags`).

### Files modified

- `app/(admin)/addnametag/page.tsx` — send `categoriesToUpdate` as `_id` strings (match description tag page + API contract)
- `e2e/fixtures/seed-data.json` — `nameTagAttachCategory`: `e2e name attach`
- `e2e/fixtures/seed-data.ts` — `SEED_NAME_TAG_ATTACH_CATEGORY` export
- `scripts/seed-e2e.mjs` — upsert name category for attach tests
- `e2e/helpers/admin-ui.ts` — `selectStyledSelectOptions`, submit-with-categories helpers, attach assertions
- `e2e/admin-category-ui.spec.ts` — 2 attach tests (name + description)
- `TESTING.md`, `CHANGES.md`

### Problems encountered and fixes

- **react-select options:** new categories created mid-test are not in the dropdown — root layout caches categories for 3 hours (`getCategoriesAndTagsWithTTL`). Attach tests use seeded categories present when the E2E server starts.
- **Name tag attach bug:** `addnametag` sent full category objects to `edittags`; API expects id strings.

### Verification

- `pnpm seed:e2e` (~8s) then `pnpm test:e2e e2e/admin-category-ui.spec.ts` — 6 passed

### Next logical step

- `/addnames` with tags on detail page — `TESTING.md` manual backlog
- Edit category/tag UI — no edit routes yet

---

## 2026-06-08 — Add names with tags E2E (`addnames.spec.ts`)

### What was built and why

Manual backlog item: submit a name with tags via `/addnames` and assert hashed tags render on `/name/[name]`.

### Files created

- `e2e/helpers/addnames-ui.ts` — tags cheat-sheet helpers, `submitNameWithTags`

### Files modified

- `e2e/fixtures/seed-data.json` — `nameTagForAddNames`: `e2e-name-tag`
- `e2e/fixtures/seed-data.ts` — `SEED_NAME_TAG_FOR_ADD_NAMES` export
- `scripts/seed-e2e.mjs` — seed name tag on `e2e name attach` category
- `e2e/addnames.spec.ts` — tag on detail page test
- `TESTING.md`, `CHANGES.md`

### Patterns

- Tags cheat sheet (same as description filter UI): Open → category disclosure → tag label click
- Assert `#e2e-name-tag` via `addHashToArrayString` output on detail page

### Verification

- `pnpm seed:e2e` then `pnpm test:e2e e2e/addnames.spec.ts` — 10 passed

### Next logical step

- `adddescriptions` with tags (symmetric to names) or edit `likedByCount` on content edit — `TESTING.md` manual backlog

---

## 2026-06-08 — Name normalization E2E (`addnames.spec.ts`)

### What was built and why

Manual backlog: spaces and punctuation variants of `E2ESeedName` must duplicate on submit and on check-if-exists search (case variant was already covered).

### Files modified

- `e2e/fixtures/seed-data.json` — `normalizationVariants.withSpaces` / `withPunctuation`
- `e2e/fixtures/seed-data.ts` — exports
- `e2e/helpers/addnames-ui.ts` — `clickNameExistsSearch`, `submitNameForDuplicateCheck`
- `e2e/addnames.spec.ts` — 4 normalization tests
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test:e2e e2e/addnames.spec.ts` — 14 passed

---

## 2026-06-08 — Add descriptions with tags + likedByCount on edit E2E

### What was built and why

Manual backlog: submit description with tags and assert hashed tag on detail page; verify owner edits do not change the like count on name/description detail pages.

### Files created

- `e2e/helpers/adddescriptions-ui.ts` — tags cheat-sheet helpers, `submitDescriptionWithTags`

### Files modified

- `e2e/helpers/descriptions.ts` — fix textarea selector `#descriptionInput` (was stale `#nameDescription`)
- `e2e/helpers/likes.ts` — `readDetailPageLikeCount`, `ensureDescriptionUnliked`
- `e2e/helpers/seed-lookup.ts` — `tags` on lookup type, `tagIdsFromSeededContent`
- `e2e/adddescriptions.spec.ts` — tag on detail page test
- `e2e/edits.spec.ts` — `likedByCount unchanged on owner edit` describe (name/description API + name UI)
- `TESTING.md`, `CHANGES.md`

### Problems encountered and fixes

- Description PUT with unchanged `content` text triggered false 409 (`shouldCheckDescriptionDuplicate` case mismatch) — notes-only update omits `content`.
- Description PUT requires `tags` array — pass `tagIdsFromSeededContent(seeded)` so route does not assign `undefined`.

### Verification

- `pnpm test:e2e e2e/adddescriptions.spec.ts e2e/edits.spec.ts` — 13 passed

---

## 2026-06-08 — Fix description PUT false-positive duplicate 409

### What was built and why

`shouldCheckDescriptionDuplicate` compared submitted `content` to `existingContent.toLowerCase()` only on the stored side, so unchanged mixed-case text still ran duplicate lookup and 409'd against the same row. Aligned with name edits: case-insensitive comparison on both sides.

### Files modified

- `utils/api/descriptionDuplicateCheck.ts` — `content.toLowerCase() !== existingContent?.toLowerCase()`
- `utils/api/descriptionDuplicateCheck.test.ts` — updated expectations for unchanged / casing-only content
- `e2e/edits.spec.ts` — description likedByCount test now sends unchanged `content` (matches UI edit dialog)
- `CHANGES.md`

### Verification

- `pnpm vitest run utils/api/descriptionDuplicateCheck.test.ts` — 6 passed

---

## 2026-06-08 — Edit tags + description notes E2E

### What was built and why

Next manual backlog items: owner edit dialog tag attach (name + description) and description notes UI (symmetric to name). Admin category/tag **edit** routes still missing; follow UI deferred in `docs/FUTURE.md`.

### Files created

- `e2e/helpers/edit-content-ui.ts` — open edit dialog, cheat-sheet tag select, save PUT

### Files modified

- `e2e/edits.spec.ts` — tag attach + description notes UI tests; reuse edit helpers in likedByCount UI test
- `e2e/helpers/seed-lookup.ts` — `seededHasTagSlug` for idempotent tag tests
- `TESTING.md`, `CHANGES.md`

### Problems encountered and fixes

- Parallel workers raced on shared seed content — `Content edits and ownership` runs serial.
- Notes field locator ambiguous on description edit (content + notes textareas) — target field after `Notes` heading.
- Description tag cheat sheet matched react-select label too — scope click to disclosure panel.

### Verification

- `pnpm test:e2e e2e/edits.spec.ts` — 10 passed

---

## 2026-06-08 — Profile bio blocklist + default avatar E2E

### What was built and why

Manual backlog: blocklisted profile bio rejection, `blockedBy` on blocklist 403 JSON, and default avatar on registration (`chooseRandomDefaultAvatar`). Register form has no bio field — blocklist applies on `PUT /api/user/editbiolocationavatar`.

### Files created

- `e2e/profile-bio.spec.ts` — API `blockedBy` + profile edit UI toast
- `e2e/helpers/profile.ts` — bio edit modal helpers
- `utils/chooseRandomDefaultAvatar.test.ts`
- `utils/api/checkMultipleBlocklists.test.ts`

### Files modified

- `app/api/user/editbiolocationavatar/route.ts` — blocklist on bio + location
- `utils/api/checkMultipleBlocklists.ts` — include `blockedBy` in 403 body
- `utils/chooseRandomDefaultAvatar.ts` — export `DEFAULT_AVATARS`
- `components/EditingData/EditBioAndProfile.tsx` — surface server blocklist message in toast
- `e2e/register.spec.ts`, `e2e/helpers/register.ts`, `e2e/helpers/seed-lookup.ts`
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm vitest run utils/chooseRandomDefaultAvatar.test.ts utils/api/checkMultipleBlocklists.test.ts` — 2 passed
- `pnpm test:e2e e2e/register.spec.ts e2e/profile-bio.spec.ts` — 5 passed

---

## 2026-06-08 — Data shape, blocklist API, banned login E2E

### What was built and why

Next manual backlog: SWR `_id` shape for descriptions, detail pages with tags + creator, `blockedBy` on name/description POST blocklist, banned credentials login.

### Files created

- `e2e/blocklist-api.spec.ts`

### Files modified

- `e2e/browse.spec.ts` — description SWR shape; detail pages assert creator + seeded tags
- `e2e/login.spec.ts` — banned account credentials rejected
- `e2e/fixtures/seed-data.json` — `bannedUser`; seed attaches tags to `E2ESeedName` + start description
- `e2e/fixtures/seed-data.ts` — `getPlaywrightBannedCredentials`
- `scripts/seed-e2e.mjs` — optional `status` on upsert; banned user; tag ids on seed content
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm seed:e2e`
- `pnpm test:e2e e2e/browse.spec.ts e2e/blocklist-api.spec.ts e2e/login.spec.ts` (filtered new tests) — 7 passed

### TODOs

- Mid-session ban + refresh — not covered (needs runtime status flip)

---

## 2026-06-08 — Description moderation UI E2E

### What was built and why

Extend suggestion/report UI coverage to description detail pages (symmetric to existing name tests).

### Files modified

- `e2e/moderation-ui.spec.ts` — suggestion + report on admin-owned description; owner menu guard
- `e2e/helpers/moderation-ui.ts` — `gotoDescriptionDetailForModeration`; reload callback for edit-dialog helpers
- `TESTING.md`, `CHANGES.md`

### Problems encountered and fixes

- Owner viewing own description has no Thank button — `requireThankButton: false` waits for ⋮ menu instead.

### Verification

- `pnpm test:e2e e2e/moderation-ui.spec.ts` — 6 passed

---

## 2026-06-08 — Landing page YouTube embed E2E

### What was built and why

Playwright coverage for landing hero video buttons (`YoutubeEmbed`): correct embed URL/title, iframe load reveals close button, toggle and single-open behavior.

### Files created

- `e2e/landing-videos.spec.ts`
- `e2e/fixtures/landing-videos.ts` — embed ids mirror `app/page.tsx`
- `e2e/helpers/landing-videos.ts` — stub `youtube-nocookie.com` for reliable `onLoad`

### Files modified

- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test:e2e e2e/landing-videos.spec.ts` — 6 passed

---

## 2026-06-08 — Profile bio happy path E2E

### What was built and why

Complement blocklist coverage: valid bio saves via API and profile edit UI, persists on profile lookup and About section.

### Files modified

- `e2e/profile-bio.spec.ts` — `Profile bio happy path` describe (API + UI)
- `e2e/helpers/profile.ts` — `saveProfileBioEdit({ expectOk })`, export `profileBioModal`
- `e2e/helpers/seed-lookup.ts` — `bio` on `lookupUserByProfileName`
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test:e2e e2e/profile-bio.spec.ts` — 4 passed

---

## 2026-06-08 — Moderation API descriptions + editsettings + login ban redirect E2E

### What was built and why

Close remaining small backlog items: description suggestion/report API (symmetric to names), editsettings display-name update, and `/login?error=Banned` toast.

### Files modified

- `e2e/moderation.spec.ts` — 4 description API tests
- `e2e/editsettings.spec.ts` — name update success path
- `e2e/login.spec.ts` — `?error=Banned` toast
- `e2e/helpers/seed-lookup.ts` — `name` on profile lookup
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test:e2e e2e/moderation.spec.ts e2e/editsettings.spec.ts e2e/login.spec.ts` — 16 passed

---

## 2026-06-08 — Data-shape E2E + login UserNotFound + leanWithStrings on duplicate checks

### What was built and why

Next backlog items: `/login?error=UserNotFound` toast (symmetric to Banned), API assertions for string `_id` / no `__v` on check-if-exists and user likes, and production fix so duplicate-check routes use `leanWithStrings`.

### Files created

- `e2e/data-shape.spec.ts`
- `e2e/helpers/data-shape.ts`

### Files modified

- `e2e/login.spec.ts` — UserNotFound redirect toast
- `app/api/names/check-if-content-exists/[content]/route.ts` — `leanWithStrings`
- `utils/stringManipulation/findNormalizedMatch.ts` — all find helpers use `leanWithStrings`
- `utils/stringManipulation/findNormalizedMatch.test.ts` — mock `lean().exec()` chain
- `TESTING.md`, `CHANGES.md`

### Problems encountered

- Check-if-exists routes returned raw Mongoose docs (`__v` present). Fixed with `leanWithStrings`.
- Description duplicate check does not populate tags; E2E accepts string tag refs or populated tag objects.

### Verification

- `pnpm vitest run utils/stringManipulation/findNormalizedMatch.test.ts` — 4 passed
- `pnpm test:e2e e2e/data-shape.spec.ts e2e/login.spec.ts -g "UserNotFound|data shape|leanWithStrings"` — 4 passed

### Next logical step

- Admin edit category/tag UI (no edit routes)
- Contact happy path with real reCAPTCHA

---

## 2026-06-08 — Mid-session ban E2E + moderation 401 + auth session invalidation fix

### What was built and why

Close backlog items: mid-session ban signs user out after refresh, unauthenticated moderation API 401 for descriptions + reports, and fix session callback so null `token.user` actually invalidates the session (stale email/name no longer kept).

### Files created

- `app/api/test/e2e/set-user-status/route.ts` — E2E ban/unban hook

### Files modified

- `lib/auth.ts` — banned users null `token.user`; JWT refresh uses `token.sub` fallback; `updateAge: 0` in E2E; session callback checks `token.user` first
- `lib/auth.test.ts` — banned/sub/session-null coverage
- `components/NavBar/NavLayoutwithSettingsMenu.tsx` — sign out when `status === "banned"`
- `e2e/auth-session.spec.ts` — mid-session ban test
- `e2e/moderation.spec.ts` — unauthenticated suggestion/report 401 (names + descriptions)
- `e2e/helpers/auth.ts` — `setE2eUserStatus`, `restorePlaywrightTestUserStatus`
- `docs/notes/lib/auth.md`, `TESTING.md`, `CHANGES.md`

### Problems encountered

- Session API still returned `{ user: { email, name } }` after `token.user = null` because the session callback only nulled when `session.user` was missing, not when `token.user` was cleared. Fixed by returning `null` when `!token.user`.

### Verification

- `pnpm vitest run lib/auth.test.ts` — 18 passed
- `CI=1 pnpm test:e2e e2e/auth-session.spec.ts -g "mid-session"` — 1 passed
- `pnpm test:e2e e2e/moderation.spec.ts -g "unauthenticated"` — 2 passed

---

## 2026-06-08 — TESTING.md manual backlog cleanup

### What was built and why

Removed stale manual checkboxes that duplicated E2E coverage; manual section now lists only dev-only work (captcha, email, visual polish) plus blocked/deferred items, with a reference table pointing to Playwright specs.

### Files modified

- `TESTING.md`, `CHANGES.md`

### Next logical step

- Contact/register/magic-link manual checks when Resend + reCAPTCHA keys are configured
- Admin edit category/tag E2E when edit routes exist

---

## 2026-06-08 — Optional E2E backlog (login errors, magic link ban, notifications shape, YouTube network)

### What was built and why

Completed the “optional future E2E” list from `TESTING.md`: DBUnavailable toast, magic-link banned redirect via NextAuth API, notification API `leanWithStrings` asserts, and real YouTube embed URL request (no stub).

### Files created

- `e2e/helpers/magic-link.ts` — `postEmailSignIn`, `expectSignInRedirectParam` (handles relative redirect URLs)

### Files modified

- `components/login.tsx` — `?error=DBUnavailable` toast
- `e2e/login.spec.ts` — DBUnavailable toast + magic-link banned API test
- `e2e/data-shape.spec.ts` — notification names/descriptions/thanks `_id` / no `__v`
- `e2e/helpers/data-shape.ts` — like/thank notification shape helpers
- `e2e/landing-videos.spec.ts` — embed network test (separate describe, no YouTube stub)
- `docs/notes/app/auth-pages.md`, `TESTING.md`, `CHANGES.md`

### Problems encountered

- NextAuth `json: true` sign-in returns a relative redirect URL (`/login?error=Banned`); `new URL(url)` threw — fixed by resolving against `NEXTAUTH_URL` / localhost origin.

### Verification

- `CI=1 pnpm test:e2e e2e/login.spec.ts -g "magic link sign-in for banned"` — 1 passed
- Prior run: notification data-shape (3), DBUnavailable toast, YouTube network — all passed

---

## 2026-06-08 — Delete content, forgot-password, magic link UI E2E

### What was built and why

Three medium-value tests from the “what’s left” list: owner delete via detail UI, forgot-password non-enumeration UX, magic link form → `/magiclink` confirmation (no email).

### Files created

- `e2e/delete-content.spec.ts`
- `e2e/forgot-password.spec.ts`
- `e2e/helpers/delete-content-ui.ts`

### Files modified

- `e2e/login.spec.ts` — magic link UI happy path
- `TESTING.md`, `CHANGES.md`

### Problems encountered

- Delete confirm dialog is nested (Headless UI + inner `role="dialog"`); confirm button needed `force: true` and text filter, not `getByRole`.
- Toast text “Content deleted successfully” matched loose `getByText('DELETED')` — use `{ exact: true }` for the content label.

### Verification

- `CI=1 pnpm test:e2e e2e/delete-content.spec.ts` — 1 passed
- `CI=1 pnpm test:e2e e2e/forgot-password.spec.ts` — 3 passed
- `CI=1 pnpm test:e2e e2e/login.spec.ts -g "magic link form"` — 1 passed

---

## 2026-06-08 — `/fetchname` search page + session refresh E2E

### What was built and why

Public single-name duplicate check on `/fetchname` and API contract tests for `POST /api/auth/session/refresh` after bio/settings DB updates (UI only calls refresh on avatar today; tests validate the endpoint returns fresh fields).

### Files created

- `e2e/fetchname.spec.ts`
- `e2e/session-refresh.spec.ts`
- `e2e/helpers/fetchname-ui.ts`

### Files modified

- `TESTING.md`, `CHANGES.md`

### Patterns followed

- Reused `clickNameExistsSearch` pattern from `e2e/helpers/addnames-ui.ts` (`#checkExists` + Search button with svg)
- Session refresh tests mirror `profile-bio.spec.ts` / `editsettings.spec.ts` API PUT flows

### TODOs

- Wire `POST /api/auth/session/refresh` + `session.update()` into bio/settings UI (avatar upload already does)

### Problems encountered

- Seeded name appears in duplicate message and listing — strict mode violation on `getByText(SEED_NAME)`; assert listing via `span.font-bold` filter instead.

### Verification

- `CI=1 pnpm test:e2e e2e/fetchname.spec.ts e2e/session-refresh.spec.ts` — 8 passed (after locator fix)

---

## 2026-06-08 — Description delete UI + reset password E2E

### What was built and why

Owner description delete mirrors name delete; reset-password flow E2E with test hook (no Resend). **`PUT /api/auth/update` production fix:** unauthenticated reset path when user has valid `passwordResetToken` (reset page was calling update while logged out → 401).

### Files created

- `e2e/reset-password.spec.ts`
- `e2e/helpers/reset-password.ts`
- `app/api/test/e2e/set-password-reset-token/route.ts`

### Files modified

- `app/api/auth/update/route.ts` — password reset branch without session
- `e2e/delete-content.spec.ts` — description delete test
- `e2e/helpers/delete-content-ui.ts` — `createUniqueDescriptionViaUi`
- `docs/notes/app/api/auth-update-route.md`, `TESTING.md`, `CHANGES.md`

### Problems encountered

- Reset password UI could never succeed before fix — `auth/update` required session; added token-gated unauthenticated branch.

### Verification

- `CI=1 pnpm test:e2e e2e/delete-content.spec.ts e2e/reset-password.spec.ts`

---

## 2026-06-08 — Edit settings password change E2E

### What was built and why

Authenticated password update via `/editsettings` — disposable registered user avoids mutating shared `PLAYWRIGHT_TEST_EMAIL` credentials used by other specs.

### Files modified

- `e2e/editsettings.spec.ts` — password change + re-login + old password rejected
- `TESTING.md`, `CHANGES.md`

### Patterns followed

- Same disposable-user approach as `e2e/reset-password.spec.ts`

### Verification

- `CI=1 pnpm test:e2e e2e/editsettings.spec.ts -g "password change"` — 1 passed

---

## 2026-06-08 — Mid-session unban + profile location E2E

### What was built and why

Round out session invalidation (unban → can sign in again) and location field coverage mirroring bio tests (API, UI, session refresh).

### Files modified

- `e2e/auth-session.spec.ts` — mid-session unban test
- `e2e/profile-bio.spec.ts` — profile location API + UI tests
- `e2e/session-refresh.spec.ts` — location refresh assert
- `e2e/helpers/profile.ts` — `fillProfileLocation`
- `e2e/helpers/seed-lookup.ts` — `location` on user lookup
- `TESTING.md`, `CHANGES.md`

### Problems encountered

- Unban re-login timed out at 30s — extended timeout; `clearCookies()` after unban clears stale JWT before credentials login.

### Verification

- `CI=1 pnpm test:e2e e2e/auth-session.spec.ts -g "unban after"` — 1 passed
- `CI=1 pnpm test:e2e e2e/profile-bio.spec.ts -g location e2e/session-refresh.spec.ts -g location` — 3 passed

---

## 2026-06-08 — Unit tests: like toggle limit, password reset hash, auth update reset, ObjectId

### What was built and why

Four high-value pure-logic gaps: extracted shared password-reset hashing + auth-update reset filters; added Vitest coverage for like-toggle rate limit wrapper and ObjectId conversion.

### Files created

- `utils/api/passwordResetToken.ts`, `passwordResetToken.test.ts`
- `utils/api/authPasswordResetUpdate.ts`, `authPasswordResetUpdate.test.ts`
- `utils/api/likeToggleRateLimit.test.ts`
- `utils/stringManipulation/convertStringToMongooseId.test.ts`

### Files modified

- `app/api/forgotpassword/route.ts`, `app/api/verifyresetpasstoken/route.ts`, `app/api/auth/update/route.ts`, `app/api/test/e2e/set-password-reset-token/route.ts` — use shared helpers
- `TESTING.md`, `docs/notes/app/api/auth-update-route.md`, `CHANGES.md`

### Verification

- `pnpm test utils/api/passwordResetToken.test.ts utils/api/authPasswordResetUpdate.test.ts utils/api/likeToggleRateLimit.test.ts utils/stringManipulation/convertStringToMongooseId.test.ts`

---

## 2026-06-08 — Unit tests: useSwrPagination getKey + delete SWR updater

### What was built and why

Extracted pure helpers from listing pagination and delete confirmation hooks; Vitest covers getKey URLs/body, liked-names early exit, optimistic SWR removal, and rollback on failed DELETE.

### Files created

- `hooks/useSwrPagination.test.ts`
- `hooks/useDeleteConfirmation.test.ts`

### Files modified

- `hooks/useSwrPagination.ts` — `buildSwrPaginationGetKey`, `shouldSkipSwrPaginationForLikes`
- `hooks/useDeleteConfirmation.ts` — `removeDeletedItemFromSwrPages`, `applyOptimisticDeleteToContent`
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test hooks/useSwrPagination.test.ts hooks/useDeleteConfirmation.test.ts` — 16 passed

---

## 2026-06-08 — useSwrPagination getKey comments preserved on extract

Restored inline comments from the original `getKey` onto `buildSwrPaginationGetKey` (end-of-list stop, SWR vs API page index, individualNames stub, POST body for large likedIds). Synced `docs/notes/hooks/useSwrPagination.md`.

---

## 2026-06-08 — applyOptimisticDeleteToContent single signature

Simplified to `(prev: T) => T` (matches `useState` updater); removed overloads and null test case.

- `hooks/useDeleteConfirmation.ts`, `hooks/useDeleteConfirmation.test.ts`

---

## 2026-06-08 — delete helper param rename deletedContentId

Unified `itemId` / `targetId` → `deletedContentId` in `removeDeletedItemFromSwrPages` and `applyOptimisticDeleteToContent`.

---

## 2026-06-08 — Unit tests: remaining hook + auth/update coverage

### What was built and why

Closed the last planned unit/hook gaps from the tier-2 backlog: `setLocalData` delete path, SWR pagination fetcher GET vs POST, and route-level smoke tests for `PUT /api/auth/update` (validation, unauthenticated reset branch).

### Files created

- `app/api/auth/update/route.test.ts`

### Files modified

- `hooks/useSwrPagination.ts` — export `swrPaginationFetcher` for direct testing
- `hooks/useSwrPagination.test.ts` — fetcher GET/POST cases
- `hooks/useDeleteConfirmation.test.ts` — optimistic `setLocalData` + rollback on failure
- `TESTING.md`, `CHANGES.md`

### Verification

- `pnpm test hooks/useDeleteConfirmation.test.ts hooks/useSwrPagination.test.ts app/api/auth/update/route.test.ts` — 26 passed

### Next logical step

Optional E2E backlog only (expired reset token, profile location blocklist, forgot-password known email 200 with Resend).

---

## 2026-06-08 — useSwrPagination.test ContentListingItem fixture

Fixed TypeScript error: `buildSwrPaginationGetKey` expects `SwrPage` rows typed as `ContentListingItem` (`LikeableContent` + `EditableContent`), not bare `{ _id }`. Added `mockListingItem()` helper and typed SWR mock state as `SwrPage[]`.

- `hooks/useSwrPagination.test.ts`
- `CHANGES.md`

---

## 2026-06-08 — E2E: expired reset token, location blocklist, forgot-password known email

### What was built and why

Last medium-value E2E backlog: expired reset token UI, profile location blocklist (symmetric to bio), and real forgot-password 200 path for seeded user without Resend.

### Files modified

- `app/api/test/e2e/set-password-reset-token/route.ts` — optional `expired: true` sets past `resetTokenExpires`
- `app/api/forgotpassword/route.ts` — skip Resend send when `E2E_TEST_MODE` (still saves token)
- `e2e/helpers/reset-password.ts` — `expired` option on token hook
- `e2e/reset-password.spec.ts` — expired token test
- `e2e/forgot-password.spec.ts` — known email API + real UI tests
- `e2e/profile-bio.spec.ts` — location blocklist API + UI
- `TESTING.md`, `CHANGES.md`

### Verification

- `CI=1 pnpm test:e2e e2e/reset-password.spec.ts e2e/forgot-password.spec.ts e2e/profile-bio.spec.ts -g "blocklist|expired|known"` — 10 passed

### Problems encountered

- Location UI test initially used `wankville` — `wank` is whole-word-only in blocklist, not substring; aligned with API test phrase `Somewhere wank suburb`.
- E2E build failed on pre-existing TS errors in `auth/update/route.ts` (`password!`) and `useSwrPagination.ts` (`likedIds !== null` guard).

---

## 2026-06-08 — lib/auth.test.ts TypeScript fixes

### What was built and why

NextAuth callback mocks used partial `user`/`account` objects that failed strict `Parameters<>` typing; `jwtParams` also defaulted `user` to `{}` (truthy), which routed tests through the sign-in branch instead of DB status refresh.

### Files modified

- `lib/auth.test.ts` — `signInParams`, `jwtParams`, `sessionParams` helpers with `NonNullable` callback types
- `CHANGES.md`

### Verification

- `pnpm exec tsc --noEmit` — no `lib/auth.test.ts` errors
- `pnpm test lib/auth.test.ts` — 17 passed

---

## 2026-06-08 — E2E hardening after full-suite failures

### What was built and why

Full E2E run (`156 pass, 3 fail, 2 flaky`) exposed cumulative-state bugs: thanks cap on seeded name, contact timing/rate-limit isolation, edit-settings strict mode, and mark-read tests assuming unread rows after `notifications-ui.spec.ts` runs first.

### Files modified

- `e2e/helpers/thanks.ts` — idempotent `submitThanks` on max-thanks 400; `resetE2eThanksForContent()`
- `app/api/test/e2e/reset-thanks/route.ts` — E2E hook to delete thanks for content
- `e2e/helpers/thanks-ui.ts` — `ThanksDialogSubmitResult`, `expectThanksDialogSubmitted()`
- `e2e/thanks-ui.spec.ts`, `e2e/notifications.spec.ts` — reset thanks / seed unread rows before mark-read tests
- `e2e/editsettings.spec.ts` — scope display-name assertion to `span.text-xl.font-bold`
- `utils/api/contactRateLimit.ts`, `app/api/test/e2e/reset-contact-rate-limit/route.ts` — contact rate limit reset hook
- `e2e/helpers/contact.ts` — `resetE2eContactRateLimit()`, `submitContactFormWithValidTiming()` (3.1s wait)
- `e2e/contact.spec.ts` — self-contained rate-limit test; scoped error locators
- `utils/api/rateLimiter.ts` — `resetAll()` + `globalThis` singleton (server action + route share one limiter in prod build)
- `components/Contact/ContactForm.tsx` — `formStartTime` uses `defaultValue` so Playwright can override for too-fast test
- `TESTING.md`, `CHANGES.md`

### Problems encountered

- Contact rate limit: hidden-field timing hack flaked under React re-renders → replaced with real 3.1s wait before submit.
- Rate limiter: separate instances in server action vs API route → fixed with `globalThis` singleton (E2E uses production `next start`).
- Mark-read API tests: `notifications-ui.spec.ts` runs alphabetically first and marks likes/thanks read → tests now unlike/relike or reset+thank to seed unread rows first.
- Browse `#e2e-filter-tag` failure after long suite without fresh seed → passes after `pnpm seed:e2e` (tags re-applied by seed script).

### Verification

- `CI=1 pnpm test:e2e e2e/contact.spec.ts` — 8 passed
- `CI=1 pnpm test:e2e e2e/notifications.spec.ts` — 9 passed
- `CI=1 pnpm test:e2e e2e/thanks-ui.spec.ts e2e/editsettings.spec.ts` — key tests passed
- `CI=1 pnpm test:e2e` — 166 passed, 1 failed (browse tag without fresh seed), 2 flaky (edits tag attach, moderation-ui timeout)

### Next logical step

Run `pnpm seed:e2e` then `CI=1 pnpm test:e2e` for a clean full-suite green; optional seed tweak to preserve description tags on upsert if tag `updateOne` ever misses.

---

## 2026-06-08 — GitHub Actions CI

### What was built and why

Automated merge gate: fast lint/unit/build on every push; full E2E on `main` and PRs using ephemeral MongoDB (no Atlas secret, fresh seed each run).

### Files created or modified

- `.github/workflows/ci.yml` — `fast` and `e2e` jobs
- `package.json` — `test:e2e:ci` (seed + playwright)
- `playwright.config.ts` — webServer uses `build:e2e` + `start:e2e`
- `TESTING.md`, `CHANGES.md`

### CI details

- E2E job: `mongo:7` service, fixed `PLAYWRIGHT_TEST_*` env, `pnpm test:e2e:ci`, Playwright trace artifact on failure
- Solo-dev friendly: E2E on direct pushes to `main`; PRs optional

### Verification

- Local: `pnpm lint`, `pnpm test`, `pnpm build` with CI-style env vars
- Fixed flaky `app/api/auth/update/route.test.ts` (`Date.now()` 1ms race on reset filter assertion)
- CI fix: removed duplicate pnpm `version` in workflow (uses `packageManager` from `package.json`)
- CI fix: dummy `RESEND_API_KEY` / `RESEND_EMAIL_FROM` in workflow for build-time `new Resend()` in `lib/auth`
- CI: Node.js 24 in workflow (GitHub deprecating Node 20 on runners)
- CI E2E: MongoDB replica set via `docker run … --replSet rs0` (GHA service `options` cannot pass mongo flags)
- CI E2E: raised E2E like-toggle cap to 200; `postToggleLike` helper retries after rate-limit reset
- Remote: push workflow and confirm Actions `fast` + `e2e` jobs green

### Next logical step

Enable branch protection on `main` requiring `fast` and `e2e` status checks.

---

## 2026-06-21 — TESTING.md test suite overview

Added **Test suite overview** section with Vitest (269 / 53 files), Playwright (169 / 28 specs), expanded E2E / RTL / pure-unit breakdown (no resume one-liner). Corrected CI e2e job description (docker replica set, not GHA service `--replSet`).

- `TESTING.md`, `CHANGES.md`

---

## 2026-06-21 — E2E moderation-ui CI timeout fix

`waitForModerationContextFetches` registered `waitForResponse` after navigation; suggestions/reports often finished first, so the helper hung until the 60s test timeout. CI snapshot also showed `undefinedprofile/…` (missing `NEXT_PUBLIC_BASE_FETCH_URL` at E2E build).

- `e2e/helpers/moderation-ui.ts` — start fetch waits before `goto`; 15s cap; scope More options to `main`; remove duplicate visibility wait in `openListingMenuItem`
- `e2e/moderation-ui.spec.ts` — 90s test timeout
- `.github/workflows/ci.yml` — `NEXT_PUBLIC_BASE_FETCH_URL: http://localhost:3000/`
- `TESTING.md`, `CHANGES.md`

Commit: `492d6e1`

---

## 2026-06-21 — CI artifact strategy (E2E + coverage)

Upload artifacts on every CI run with `if: always()`; control payload via Playwright config and retention days, not failure-only gates.

- `playwright.config.ts` — CI reporters (list + html + junit); explicit `screenshot`/`video`/`trace` options
- `.github/workflows/ci.yml` — `fast`: `pnpm test:ci` + coverage artifact (7d); `e2e`: HTML report (7d) + test-results/traces (14d), both `if: always()`
- `TESTING.md`, `CHANGES.md`

### Next logical step

Confirm first Actions run uploads `playwright-report` on green E2E and `vitest-coverage` on green fast job.

---

## 2026-06-21 — E2E adddescriptions blocklist strict mode fix

`getByText(/wank|…/)` matched both the textarea value and the `WarningMessage` banner — Playwright strict mode violation. Assert via 403 response + `p.bg-red-900` banner (API message for `wank` is banned-everywhere / blocklist wording, not substring phrase text).

- `e2e/adddescriptions.spec.ts`
- `CHANGES.md`

---

## 2026-08-20 — Fredoka heading font

### What was built and why

Headers had no font of their own — `<h1>`-`<h6>` just inherited the body font (Comfortaa, `@import`'d in `globals.css` and mapped to Tailwind's `font-sans`). Added **Fredoka**, a rounded/playful Google Font, as a dedicated heading font via `next/font/google` (self-hosted, no runtime request to Google Fonts), applied globally to all headings via one CSS rule rather than editing each of the ~9 components that render bare heading tags.

### Files modified

- `app/layout.tsx` — `Fredoka({ subsets: ["latin"], weight: "variable", display: "swap", variable: "--font-fredoka" })`; variable's className added to `<html>`
- `tailwind.config.js` — new `fontFamily.heading` key: `["var(--font-fredoka)", "ui-rounded", '"Comic Sans MS"', "sans-serif"]`, alongside the existing `sans: Comfortaa` key
- `styles/globals.css` — `h1, h2, h3, h4, h5, h6 { @apply font-heading; }` added to the `@layer base` block that already sets `body { @apply font-sans; }`
- `components/LandingPage/HeroTop.tsx` — removed a stray `font-serif` class on the hero wrapper div (the only `font-serif` usage in the codebase) that was overriding the inherited font for that hero's `<h1>`, so it now picks up Fredoka like every other heading

### Options considered

- **Loading method:** `next/font/google` vs. a plain CSS `@import` matching how Comfortaa is currently loaded. Went with `next/font/google` — it's the idiomatic Next 15 App Router approach (build-time self-hosting, `font-display: swap`, no external request/render-block), even though it's a new pattern for this repo (Comfortaa's `@import` was left as-is, out of scope).
- **Application scope:** one global `h1..h6` CSS rule vs. a `font-heading` utility class added by hand to every existing heading across ~9 components. Went with the global rule — matches the existing `body { font-sans }` pattern, covers all current and future headings with no per-component edits, and needs no upkeep as new headings are added.

### Problems encountered

- First `pnpm/npm run build` failed at "Collecting page data" with `PageNotFoundError: Cannot find module for page: /_not-found`. Root cause: a stale `.next` build cache, not the font change — confirmed by (a) `git stash` + rebuild on the pre-change code succeeding cleanly, and (b) `rm -rf .next` + rebuild on the changed code also succeeding cleanly, with self-hosted Fredoka `.woff2` files present in `.next/static/media/`.

### Verification

- `npm run build` (after clearing `.next`) — compiled successfully; self-hosted `.woff2` font files present in build output.
- Manual: dev server, hero `<h1>` and body `<p>` inspected in DevTools — heading resolves to the Fredoka variable, body text still resolves to Comfortaa.

### Note

Headings styled `font-extrabold`/`font-black` (e.g. the HeroTop hero title) will render at Fredoka's max native weight (700) rather than a true 800/900 — expected graceful degradation, not a defect.
