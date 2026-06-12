# Strict mode: 21 errors fixed (2026-06-07)

When `tsconfig.json` was flipped from `"strict": false` to `"strict": true`, `pnpm exec tsc --noEmit` reported **21 errors** across 12 files. This note records each category: the compiler message, the code involved, why strict mode surfaced it, and the fix.

Related: [`CHANGES.md`](../../../CHANGES.md) (2026-06-07 entry), [`type-vs-interface.md`](type-vs-interface.md).

---

## Summary table

| # | File(s) | Error code | Root cause |
|---|---------|------------|------------|
| 1–4 | Notification routes + page | TS2345 | `Model<unknown>` rejected typed Mongoose models |
| 5 | `models/Name.ts` | TS7016 | No types for `mongoose-unique-validator` |
| 6–7 | `ContactForm.tsx`, `RegisterForm.tsx` | TS7016 | No types for `react-google-recaptcha` |
| 8 | `email-button.tsx` | TS7031 | Destructured props without a type |
| 9 | `CoreListingPagesLogic.tsx` | TS2322 | Required vs optional function parameter |
| 10–12 | `StyledSelect.tsx` | TS2322 / TS2769 | `next/dynamic` erased `react-select` generics |
| 13–14 | `RegisterForm.tsx` | TS2322 / TS7006 | react-hook-form `Validate` union + implicit `any` |
| 15–18 | `ContentListing.tsx` + hooks | TS2719 / TS2322 / TS2345 | Duplicate local `SwrPage` types; narrow content types |
| 19 | `addingName.tsx` | TS2322 | `Dispatch<SetStateAction<string>>` vs union alert props |
| 20–21 | `ToggeableAlert.tsx` + call sites | TS2322 / TS2345 | Generic inference + dismiss handler |
| — | `useDeleteConfirmation.ts` | TS2345 | Rollback returned `DeleteTarget` where `T` expected |
| — | `useSwrPagination.ts` | TS2322 | `mutate` updater marked required vs SWR optional |

Items 20–21 and the hook follow-ups appeared only after the first pass; they are included because they blocked a clean `tsc` + `pnpm build`.

---

## 1–4. Mongoose `Model<unknown>` vs typed models

### Error (same shape in four call sites)

```
error TS2345: Argument of type 'Model<INameLikeDocument, ...>' is not assignable to parameter of type 'Model<unknown, ...>'.
  Type 'unknown' is not assignable to type 'INameLikeDocument'.
```

**Files:** `app/(protected)/notifications/page.tsx`, `app/api/notifications/names/route.ts`, `app/api/notifications/descriptions/route.ts`, `app/api/notifications/thanks/route.ts`.

### Before

```ts
// utils/api/getPaginatedNotifications.ts
export async function getPaginatedNotifications(
  model: Model<unknown>,
  filter: Record<string, unknown> = {},
  // ...
) {
  return leanWithStrings(model.find(filter).populate(populateOptions) /* ... */);
}

// Call site (example)
await getPaginatedNotifications(NameLike, filter, populate);
```

### Why

Under `strict: true`, Mongoose’s `Model` is **invariant** in its document type parameter. A function that accepts `Model<unknown>` cannot be called with `Model<INameLikeDocument>`: TypeScript must guarantee that anything the helper does with `unknown` documents is safe for *every* concrete document type. The mismatch shows up on `castObject`, `schema.static`, and related APIs.

With `strict: false`, `noImplicitAny` and related checks were looser; this assignment often slipped through.

### Fix

Use a **generic** bounded by Mongoose’s `Document`:

```ts
import type { Document, Model, PopulateOptions } from "mongoose";

export async function getPaginatedNotifications<TDoc extends Document>(
  model: Model<TDoc>,
  filter: Record<string, unknown> = {},
  populateOptions: PopulateOptions | PopulateOptions[] = [],
  { page = 1, limit = 25 }: PaginationOptions = {},
) {
  // unchanged body
}
```

Call sites stay the same; each passes its own `Model<SpecificDoc>` and inference picks `TDoc`.

---

## 5. `mongoose-unique-validator` — missing declaration file

### Error

```
models/Name.ts(5,29): error TS7016: Could not find a declaration file for module 'mongoose-unique-validator'.
```

### Before

```ts
import uniqueValidator from "mongoose-unique-validator";
```

### Why

`strict` enables **`noImplicitAny` for untyped modules**. The package ships JavaScript only; without `@types/mongoose-unique-validator` (none published), every import is implicitly `any` — an error in strict mode.

### Fix

Ambient module declaration in `types/modules.d.ts`:

```ts
declare module "mongoose-unique-validator";
```

`tsconfig.json` already includes `**/*.ts`, so this file is picked up automatically. Runtime behavior is unchanged; we only tell TypeScript “this import exists.”

---

## 6–7. `react-google-recaptcha` — missing declaration file

### Error

```
components/Contact/ContactForm.tsx(16,23): error TS7016: Could not find a declaration file for module 'react-google-recaptcha'.
components/Register/RegisterForm.tsx(13,23): error TS7016: ...
```

### Before

```tsx
import ReCAPTCHA from "react-google-recaptcha";
```

### Why

Same as §5: strict mode does not allow untyped third-party modules.

### Fix

```ts
// types/modules.d.ts
declare module "react-google-recaptcha";
```

Optional follow-up: install `@types/react-google-recaptcha` if you want full prop typing instead of a stub.

---

## 8. Email button — destructured props without types

### Error

```
error TS7031: Binding element 'buttonHref' implicitly has an 'any' type.
error TS7031: Binding element 'buttonText' implicitly has an 'any' type.
```

### Before

```tsx
interface EmailButtonTemplateProps {
  buttonHref?: string;
  buttonText?: string;
}

export const EmailButtonTemplate = ({ buttonHref, buttonText }) => (
  <Link href={buttonHref}>...</Link>
);
```

### Why

An `interface` beside the component does **not** apply itself. Under `noImplicitAny` (part of `strict`), destructured parameters without an annotation are `any`.

### Fix

Attach the interface to the parameter list:

```tsx
export const EmailButtonTemplate = ({
  buttonHref,
  buttonText,
}: EmailButtonTemplateProps) => (
  <Link href={buttonHref}>...</Link>
);
```

---

## 9. `handleApplyFilters` — optional vs required `reset`

### Error

```
components/CoreListingPagesLogic.tsx(...): error TS2322: Type '(reset: boolean, ...) => void' is not assignable to type '(reset?: boolean, ...) => void'.
  Types of parameters 'reset' and 'reset' are incompatible.
    Type 'boolean | undefined' is not assignable to type 'boolean'.
```

### Before

```tsx
// CoreListingPagesLogic.tsx
const handleApplyFilters = (reset: boolean, quickSearchTags?: string[]) => { /* ... */ };

// FilteringSidebar.tsx — prop type
handleApplyFilters: (reset?: boolean, quickSearchTags?: string[]) => void;

// FilteringSidebar calls:
handleApplyFilters();        // no first arg
handleApplyFilters(true);    // reset
```

### Why

**Function parameter contravariance:** a callback typed with a *required* `boolean` cannot satisfy a prop that may call it with `undefined` (omitted argument). `FilteringSidebar` calls `handleApplyFilters()` with no args; the implementation must accept `reset` being undefined.

### Fix

Default the parameter instead of requiring it:

```tsx
const handleApplyFilters = (reset = false, quickSearchTags?: string[]) => {
  if (reset) { /* clear filters */ }
  else { /* apply */ }
};
```

---

## 10–12. `StyledSelect` — `next/dynamic` erased `react-select` generics

### Errors (representative)

```
error TS2322: Type 'StylesConfig<FormattedOption, true>' is not assignable to type 'StylesConfig<unknown, boolean, ...>'.
error TS2322: Type '(selected: MultiValue<FormattedOption>) => void' is not assignable to type '(newValue: unknown, ...) => void'.
error TS2322: Type 'boolean' is not assignable to type 'true'.
```

### Before

```tsx
const NoSSRSelect = dynamic(() => import("react-select"), { ssr: false });

const selectStyles: StylesConfig<FormattedOption, true> = { /* ... */ };

<NoSSRSelect
  isMulti={isMulti}          // isMulti: boolean
  styles={selectStyles}
  onChange={(selected: MultiValue<FormattedOption>) => { /* ... */ }}
/>
```

### Why

1. **`dynamic()` return type** is a loosely typed component; props fall back to `unknown`, so your typed `onChange` / `styles` do not match.
2. **`StylesConfig<FormattedOption, true>`** fixes the second generic to literal `true` (multi-only). Passing `isMulti={boolean}` conflicts — TypeScript expects literal `true`.
3. **`onChange`** in multi mode receives `MultiValue<Option> | SingleValue<Option>`; narrowing to only `MultiValue` is unsafe under strict function typing.

### Fix

```tsx
import type ReactSelect from "react-select";

const NoSSRSelect = dynamic(() => import("react-select"), {
  ssr: false,
}) as typeof ReactSelect;

const selectStyles: StylesConfig<FormattedOption, boolean> = { /* ... */ };

<NoSSRSelect
  isMulti={isMulti}
  styles={selectStyles}
  onChange={(selected) => {
    const multi = (Array.isArray(selected) ? selected : []) as MultiValue<FormattedOption>;
    // ...
  }}
/>
```

Casting to `typeof ReactSelect` restores generics; widening `true` → `boolean` on `StylesConfig` matches the `isMulti` prop.

---

## 13–14. `RegisterForm` — validate callbacks and reCAPTCHA token

### Errors

```
error TS2322: Type '(value: string) => string | true' is not assignable to type 'Validate<string | boolean, RegisterFormValues>'.
  Type 'string | boolean' is not assignable to type 'string'.

error TS7006: Parameter 'token' implicitly has an 'any' type.
```

### Before

```tsx
validation={{
  validate: (value: string) =>
    value.match(/[^a-z\d&'-]+/) == null || `Invalid characters...`,
}}

<ReCAPTCHA onChange={(token) => setV2Token(token)} />
```

### Why

1. **`RegisterInput`** is shared by text fields and checkboxes. react-hook-form’s `Validate` for a field can receive `string | boolean` when the form value union includes booleans (e.g. `over13: boolean`). A validator typed `(value: string) => ...` rejects that wider input type.
2. With only a `declare module "react-google-recaptcha"` stub, **`onChange` callback parameters are not typed** → implicit `any` under `noImplicitAny`.

### Fix

```tsx
validate: (value: string | boolean) => {
  if (typeof value !== "string") return true;
  return value.match(/[^a-z\d&'-]+/) == null || `Invalid characters...`;
},

<ReCAPTCHA onChange={(token: string | null) => setV2Token(token)} />
```

Same pattern for `confirmPassword` validate. Non-string values skip string-only rules.

---

## 15–18. `ContentListing` — SWR pages, edit/delete hooks, suggestions

These four related errors all came from **parallel type definitions** that looked similar but were unrelated under strict checking.

### 15. `useEditHandler` / `mutate` — duplicate `SwrPage` types

```
error TS2719: Type '((updater: ...) => void) | undefined' is not assignable ...
  Type 'SwrPage' is not assignable to type 'SwrPage'. Two different types with this name exist, but they are unrelated.
    Types of property 'data' are incompatible.
      Type 'ListingContent[]' is not assignable to type 'ContentListingItem[]'.
```

### Before

```ts
// useEditHandler.ts
type ListingContent = { _id: string };
type SwrPage = { data: ListingContent[] };

// ContentListing.tsx
type SwrPage = { data: ContentListingItem[] };  // LikeableContent & EditableContent
```

### Why

TypeScript treats two **distinct** `SwrPage` aliases as incompatible even if shapes overlap. `ContentListingItem` has `likedByCount`, `createdBy`, etc.; `ListingContent` only had `_id`. The `mutate` function’s updater return type must match exactly.

### Fix

Generic hook bounded by row shape:

```ts
type SwrPage<T extends { _id: string }> = { data: T[]; totalDocs?: number };

export function useEditHandler<T extends { _id: string }>({
  mutate?: (updater?: (pages?: SwrPage<T>[]) => SwrPage<T>[], shouldRevalidate?: boolean) => void;
  setLocalData: (item: T) => void;
}) { /* ... */ }

// ContentListing.tsx
useEditHandler<ContentListingItem>({ mutate, setLocalData: setLocalContent });
```

Also mark `mutate`’s `updater` **optional** to match SWR’s `mutate()` (revalidate only) and `mutate(fn)` (optimistic update).

---

### 16. `openEdit` — `EditButton` passed minimal `{ _id }`

```
error TS2345: Argument of type 'ListingContent' is not assignable to parameter of type 'ContentListingItem'.
  Type 'ListingContent' is missing ... likedByCount, createdBy
```

### Before

```tsx
<EditButton
  content={singleContent}
  onupdateEditState={(item, e) => {
    if (item) openEdit(item);  // item typed as { _id: string }
  }}
/>
```

### Why

`EditButton` typed `content` / callback as `{ _id: string }`. `openEdit` after the generic fix expects full `ContentListingItem`.

### Fix

Open edit with the row we already have:

```tsx
if (item) openEdit(singleContent);
```

---

### 17. `confirmDelete` — `SwrMutate` vs listing `mutate`

```
error TS2345: Argument of type '((updater: ...) => void) | undefined' is not assignable to parameter of type 'SwrMutate<ContentListingItem> | undefined'.
```

### Before

```ts
// useDeleteConfirmation — narrow page data
type SwrDeletePage = { data: { _id: string }[] };

// ContentListing — wide row type
mutate?: (updater: (pages?: SwrPage[]) => SwrPage[], ...) => void;  // updater required
```

### Why

Same contravariance issue as §9, plus return-type mismatch on optimistic delete (filter returns pages whose `data` is inferred as `{ _id: string }[]` not `ContentListingItem[]`).

### Fix

```ts
type SwrPageLike<T extends { _id: string }> = { data: T[]; totalDocs?: number };

type SwrMutate<T extends { _id: string }> = (
  updater?: (pages?: SwrPageLike<T>[]) => SwrPageLike<T>[],
  shouldRevalidate?: boolean,
) => void;

async function confirmDelete<T extends { _id: string }>(
  /* ... */,
  customMutate?: SwrMutate<T>,
  setLocalData?: Dispatch<SetStateAction<T>>,
) { /* ... */ }
```

`useSwrPagination`’s exported `mutate` type was updated the same way (optional `updater`).

---

### 18. `SuggestionButton` — `openSuggestion` content shape

```
error TS2322: Type '(content: SuggestionContentInfo) => void' is not assignable to type '(content: ListingContent) => void'.
  Property 'createdBy' is missing in type 'ListingContent' but required in type 'SuggestionContentInfo'.
```

### Before

```tsx
// SuggestionButton.tsx
type ListingContent = { _id: string };
onClick: (content: ListingContent) => void;

// useSuggest.ts
function openSuggestion(content: SuggestionContentInfo) { /* ... */ }
```

### Fix

Align button props with suggestion dialog needs:

```tsx
import type { SuggestionContentInfo } from "@/components/Suggestions/AddSuggestion";

export type SuggestionButtonProps = {
  content: SuggestionContentInfo;
  onClick: (content: SuggestionContentInfo) => void;
};
```

`ContentListing` already passes `singleContent`, which includes `createdBy`.

---

## 19. `addingName` — alert state setter vs union props

### Error

```
components/AddingNewData/addingName.tsx(262,13): error TS2322:
  Type 'Dispatch<SetStateAction<string>>' is not assignable to type 'Dispatch<SetStateAction<string | boolean>>'.
```

### Before

```tsx
const [nameSubmissionMessage, setNameSubmissionMessage] = useState("");

<ToggeableAlert
  text={nameSubmissionMessage}
  setToggleState={setNameSubmissionMessage}
  toggleState={nameSubmissionMessage}
/>
```

```tsx
// ToggeableAlert — original props
setToggleState: Dispatch<SetStateAction<boolean | string>>;
```

### Why

`Dispatch` is **invariant** in its type parameter. A setter that only accepts `string` cannot be used where the child might call `setToggleState(false)` (boolean dismiss).

### Fix

See §20 — generic `ToggeableAlert<T>` so `addingName` infers `T = string` and props match exactly.

---

## 20–21. `ToggeableAlert` — generics, narrowing, dismiss handler

### Errors

```
error TS2322: Type 'Dispatch<SetStateAction<boolean>>' is not assignable to type 'Dispatch<SetStateAction<true>>'.
error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'SetStateAction<T>'.
```

### Before

```tsx
// Inside {ideaFormToggled && <ToggeableAlert toggleState={ideaFormToggled} ... />}
// TypeScript narrows ideaFormToggled to literal `true` → T inferred as `true`, not `boolean`

onClick={() => setToggleState(!toggleState)}  // `!toggleState` is boolean, not T
```

### Why

1. **Control-flow narrowing:** in `{flag && <Alert toggleState={flag} />}`, if `flag` is `boolean`, TypeScript narrows to `true` inside the branch → setter expects `Dispatch<SetStateAction<true>>`, which rejects `Dispatch<SetStateAction<boolean>>`.
2. **Dismiss:** toggling with `!toggleState` produces `boolean`, but `T` might be `string`.

### Fix

```tsx
export type ToggeableAlertProps<T extends boolean | string = boolean | string> = {
  text: string;
  toggleState: T;
  setToggleState: Dispatch<SetStateAction<T>>;
};

export default function ToggeableAlert<T extends boolean | string>({ ... }: ToggeableAlertProps<T>) {
  return (
  <GeneralButton
    onClick={() =>
      setToggleState((typeof toggleState === "boolean" ? false : "") as T)
    }
  />
  );
}

// ContentListing — explicit type args where narrowing bites
<ToggeableAlert<boolean> toggleState={ideaFormToggled} ... />
<ToggeableAlert<string | boolean> toggleState={showLikesSignInMessage} ... />
```

---

## Follow-up: delete rollback type (`useDeleteConfirmation`)

### Error

```
error TS2345: Type 'DeleteTarget' is not assignable to type 'T'.
```

### Before

```ts
setLocalData((prev) =>
  prev && prev._id === deleteTarget._id ? deleteTarget : prev,
);
```

### Why

After generic `confirmDelete<T>`, rollback must return `T`. `deleteTarget` is stored as `DeleteTarget` (`{ _id, content? }`), not full `ContentListingItem`.

### Fix

```ts
setLocalData((prev) =>
  prev && prev._id === deleteTarget._id ? (deleteTarget as T) : prev,
);
```

Narrow cast at the optimistic-UI boundary; runtime object is still the same row reference from open delete.

---

## What strict mode changed overall

| Flag (bundled in `strict`) | Effect in this pass |
|----------------------------|---------------------|
| `noImplicitAny` | Untyped modules, destructuring, callback params |
| `strictFunctionTypes` | Callback parameter optional/required, `Dispatch` variance |
| `strictNullChecks` | Already on; continued to guard session/env access |
| Generics invariance | Mongoose `Model<T>`, duplicate nominal `SwrPage` aliases |

---

## Verification

```bash
pnpm exec tsc --noEmit   # strict: true
pnpm build
```

Both pass after these fixes.

---

## Files touched

- `tsconfig.json` — `"strict": true`
- `types/modules.d.ts` — new
- `utils/api/getPaginatedNotifications.ts`
- `hooks/useEditHandler.ts`, `hooks/useDeleteConfirmation.ts`, `hooks/useSwrPagination.ts`
- `components/CoreListingPagesLogic.tsx`, `ContentListing.tsx`, `ToggeableAlert.tsx`, `StyledSelect.tsx`, `SuggestionButton.tsx`, `RegisterForm.tsx`, `ContactForm.tsx`, `email-button.tsx`
