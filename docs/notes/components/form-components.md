# Form components

Shared styled inputs used across add/edit, auth, admin, and filter UIs.

## `StyledCheckbox`

Source: [`components/FormComponents/StyledCheckbox.tsx`](../../../components/FormComponents/StyledCheckbox.tsx)

Paw icon checkbox. **`value` is the DOM `id` / `htmlFor`** — must be globally unique (Mongo tag `_id`), not an index.

```tsx
// components/Filtering/FilteringSidebar.tsx
<StyledCheckbox
  label={option.tag} // visible text
  value={option._id} // unique id for accessibility
  checked={filterTagsIds.includes(option._id)}
  onChange={handleFilterChange}
  className="group px-2"
/>
```

```tsx
// components/FormComponents/StyledCheckbox.tsx — native input must expose value to onChange
<input
  id={value}
  value={value} // important so your handler sees it
  type="checkbox"
  checked={checked}
  onChange={onChange}
  ...
/>
```

### Special behavior: `id` / focus (from source comments)

Do **not** use `id={`filter-mobile-${index}`}`:

> `id={`filter-mobile-${index}`} wasn't working, htmlFor={id} and `<input id={id}>` kept breaking  
> Once a panel opens, closes, or React remounts, index-based ids break uniqueness across multiple panels — `filter-mobile-0` would be shared by multiple boxes that were open.  
> This fixed the “mouse click stuck/focus jumping” bug because the first focusable element Headless UI sees is actually the right one, and it doesn’t collide with duplicates or indices that might have changed.  
> **value works because this will always be globally unique**

### Special behavior: hiding the native checkbox (mobile / a11y)

> Don't use `sr-only` here — Chrome mobile scroll bug  
> Instead, physically remove from layout but keep focusable and accessible  
> but `peer absolute left-[-9999px] ...` was leading to double vertical scrollbars  
> **Solution:** `fixed` + `1px` size + `clip` / `clipPath: inset(50%)` — same idea as sr-only but avoids `position: absolute; left: 0` misbehaving on some mobile browsers

**Consumers:** [`FilteringSidebar.tsx`](../../../components/Filtering/FilteringSidebar.tsx), flag/suggestion/thanks forms, [`preserveTextAfterSubmission.tsx`](../../../components/AddingNewData/preserveTextAfterSubmission.tsx).

---

## `StyledInput`

Source: [`components/FormComponents/StyledInput.tsx`](../../../components/FormComponents/StyledInput.tsx)

Optional label + single-line input (controlled). No SSR or hydration quirks — standard server/client input.

```tsx
<StyledInput
  type="text"
  id="categoryInput"
  className="text-secondary"
  onChange={(e) => setNewNameTag(e.target.value)}
  value={newNameTag}
  label="Enter a name tag to add"
/>
```

**Consumers:** admin category pages, [`ContactForm.tsx`](../../../components/Contact/ContactForm.tsx), [`EditContent.tsx`](../../../components/EditingData/EditContent.tsx), `login.jsx`, `forgotpassword.jsx`.

---

## `StyledTextarea`

Source: [`components/FormComponents/StyledTextarea.tsx`](../../../components/FormComponents/StyledTextarea.tsx)

Themed textarea; `disabled` uses `errorBackgroundColor` / `errorTextColor` utility classes. No SSR-specific logic.

```tsx
<StyledTextarea
  ariaLabel="description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  maxLength={400}
  required
/>
```

**Consumers:** [`addingName.tsx`](../../../components/AddingNewData/addingName.tsx), [`addingdescription.tsx`](../../../components/AddingNewData/addingdescription.tsx), suggestions, flags ([`AddReport.tsx`](../../../components/Flagging/AddReport.tsx) uses `StyledCheckbox` with `label` + `description` for report categories), contact, edit flows.

---

## `StyledSelect`

Source: [`components/FormComponents/StyledSelect.tsx`](../../../components/FormComponents/StyledSelect.tsx)

```tsx
const NoSSRSelect = dynamic(() => import("react-select"), { ssr: false });
```

```tsx
// app/(admin)/addnametag/page.js
<StyledSelect
  id="categoryTags"
  options={categoriesWithTags}
  value={categoriesChosen}
  onChange={setCategoriesChosen}
  labelProperty="category"
  valueProperty="_id"
/>
```

### Special behavior: SSR / hydration (from source comments)

`"use client"` alone does **not** skip server HTML — Next still prerenders; hydration must match client output.

> disable SSR completely to take care of this hydration Warning: Prop id did not match. Server: `"react-select-2-live-region"` Client: `"react-select-3-live-region"`  
> even though its `"use client"`, a `"use client"` component just means “hydrate me on the client too”, not “skip rendering on the server”  
> so its still prerendered on the server to HTML. When hydration runs, React tries to match that HTML with what the client generates  
> That warning is because **react-select generates random IDs** which don’t match between server-render and client-render

**Fix:** `dynamic(() => import("react-select"), { ssr: false })` — component only mounts on client.

Compare [`TagsSelectAndCheatSheet.tsx`](../../../components/FormComponents/TagsSelectAndCheatSheet.tsx) (imports `react-select` directly on add forms — different usage path).

### Special behavior: option formatting / flicker

```tsx
// create a stable array of react-select-friendly objects
const formattedOptions = useMemo(() =>
  options.map((opt) => ({
    ...opt,
    label: opt[labelProperty],
    value: opt[valueProperty],
  })), [options, labelProperty, valueProperty]);

// Match selected values with formattedOptions — preserves reference equality so react-select won't flicker
const formattedValue = useMemo(() =>
  value.map((v) => formattedOptions.find((o) => o._id === v._id)).filter(Boolean),
  [value, formattedOptions]);
```

On change, strip synthetic `label` / `value` and return raw objects (`_id`, `category`, etc.):

```tsx
onChange={(selected) => {
  const normalized = (selected || []).map((s) => {
    const { label, value, ...rest } = s;
    return rest;
  });
  onChange(normalized);
}}
```

Styling split: `className` on the control; `styles` prop for dropdown menu (dark purple theme).

**Consumers:** `addnametag`, `adddescriptiontag` admin pages.

---

## `RegisterInput`

Source: [`components/FormComponents/RegisterInput.tsx`](../../../components/FormComponents/RegisterInput.tsx)

`react-hook-form` wrapper — `register(id, validation)`, optional `helperText`, `error.message` line.

```tsx
<RegisterInput
  id="email"
  label="Email"
  type="email"
  register={register}
  validation={{ required: "Please enter an email", pattern: { ... } }}
  error={errors.email}
  helperText={["Valid characters: any", <p key="changeable"><strong>Can</strong> be changed later</p>]}
/>
```

### Special behavior: `helperText` rendering (from source comments)

Requires `import React` for **`React.cloneElement`** when helper is JSX.

| Case | Behavior |
|------|----------|
| **1** array | Map each item |
| **1.a** string in array | Wrap in `<p className="text-sm text-gray-300 mt-1">` |
| **1.b** JSX in array | `cloneElement` to merge standard helper classes with existing `className` |
| **2** not array | |
| **2.1** string | Single `<p>` with helper classes |
| **2.2** JSX | `cloneElement` with helper classes |

`className` on `RegisterInput` is merged onto the `<input>` (TS fix — was passed from `RegisterForm` but ignored in the old `.jsx`).

**Consumers:** [`RegisterForm.tsx`](../../../components/Register/RegisterForm.tsx), `login.jsx`, `editsettings/page.js`.

---

## `PreserveTextAfterSubmission`

Source: [`components/AddingNewData/preserveTextAfterSubmission.tsx`](../../../components/AddingNewData/preserveTextAfterSubmission.tsx)

“Keep text” toggle on bulk add flows; uses `StyledCheckbox` with fixed `value="do not clear"`.

```tsx
<PreserveTextAfterSubmission
  doNotClear={doNotClear}
  setDoNotClear={setDoNotClear}
/>
```

**Consumers:** [`addingName.tsx`](../../../components/AddingNewData/addingName.tsx), [`addingdescription.tsx`](../../../components/AddingNewData/addingdescription.tsx).

## Related

- [filtering-sidebar.md](./filtering-sidebar.md)
- [add-content-forms.md](./add-content-forms.md)
- [tags-select-and-cheat-sheet.md](./tags-select-and-cheat-sheet.md)
