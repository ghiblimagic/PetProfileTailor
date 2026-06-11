# `FilteringSidebar`

Source: [`components/Filtering/FilteringSidebar.tsx`](../../../components/Filtering/FilteringSidebar.tsx)

## Role

Filter drawer: quick-filter buttons (names only), category/tag disclosures, reset/apply. Rendered inside MUI `Drawer` in [`CoreListingPagesLogic.tsx`](../../../components/CoreListingPagesLogic.tsx).

## Props type

```tsx
// components/Filtering/FilteringSidebar.tsx
export type FilteringSidebarProps = {
  dataType: ContentType;
  handleFilterChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleApplyFilters: (reset?: boolean, quickSearchTags?: string[]) => void;
  filterTagsIds: string[];
  setFilterTagsIds: Dispatch<SetStateAction<string[]>>;
  toggleDrawer: (open: boolean) => void;
  isLoading: boolean;
  remainingFilterCooldown: number;
};
```

## Apply / reset / quick filter

```tsx
// components/Filtering/FilteringSidebar.tsx
const applyQuickFilter = (tagIds: string[]) => {
  if (remainingFilterCooldown > 0 || isLoading) return;
  setFilterTagsIds(tagIds);
  handleApplyFilters(false, tagIds);  // don't wait for checkbox state
  toggleDrawer(false);
};

const onApplyClick = () => {
  if (remainingFilterCooldown > 0 || isLoading) return;
  handleApplyFilters();
  toggleDrawer(false);
};

// Reset button
onClick={() => {
  handleApplyFilters(true);  // was handleApplyFilters("reset") in JS
  toggleDrawer(false);
}}
```

Parent [`handleApplyFilters`](../../../components/CoreListingPagesLogic.tsx):

```tsx
// components/CoreListingPagesLogic.tsx
const handleApplyFilters = (reset: boolean, quickSearchTags?: string[]) => {
  if (reset) {
    setFilterTagsIds([]);
    setTriggerApplyFilters([]);
  } else {
    startCooldown(filterCooldownRef, setRemainingFilterCooldown);
    setTriggerApplyFilters(quickSearchTags ?? filterTagsIds);
  }
  setCurrentUiPage(1);
  setSize(1);  // restart SWR from first chunk
};
```

Draft selection (`filterTagsIds`) vs applied filters (`triggerApplyFilters` → SWR `tags`).

## Quick filters (names only)

```tsx
// components/Filtering/FilteringSidebar.tsx
{dataType === "names" && (
  <GeneralButton
    text="Common Pet Names"
    onClick={() => applyQuickFilter(["68ef04450f2c50aed0721f5a"])}
  />
  // Human Names:     68e037d103ba0c640c8bc35a
  // Cutesy:          6401efe2d9f774e804cb359f
  // Spicy, Sassy:    641cc403d235cbd605de96bb
  // Friendly, Sweet: 6401ef92d9f774e804cb3578
)}
```

## Category disclosures + checkboxes

```tsx
// components/Filtering/FilteringSidebar.tsx
{categoriesWithTags.map((category) => (
  <Disclosure key={category._id}>
    {({ open }) => (
      <>
        <DisclosureButton>
          <span>{category.category}</span>
          <span>
            {category.tags
              .filter((tag) => filterTagsIds.includes(tag._id))
              .map((tag) => tag.tag)
              .join(", ")}
          </span>
        </DisclosureButton>
        <DisclosurePanel>
          {category.tags.map((option) => (
            <StyledCheckbox
              key={option._id}
              label={option.tag}
              value={option._id}
              checked={filterTagsIds.includes(option._id)}
              onChange={handleFilterChange}
            />
          ))}
        </DisclosurePanel>
      </>
    )}
  </Disclosure>
))}
```

Parent checkbox handler:

```tsx
// components/CoreListingPagesLogic.tsx
const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
  const { value, checked } = e.target;
  checked
    ? setFilterTagsIds([...filterTagsIds, value])
    : setFilterTagsIds(filterTagsIds.filter((tag) => tag !== value));
};
```

## StyledCheckbox `id` bug (use `value`, not index)

Do **not** pass `id={`filter-mobile-${index}`}` — caused mobile focus / stuck-click when panels remount.

```jsx
// components/FormComponents/StyledCheckbox.tsx
// id={`filter-mobile-${index}`} wasn't working ...
// Once a panel opens, closes, or React remounts, index-based ids break uniqueness
// value works because this will always be globally unique
return (
  <label htmlFor={value}>
    <input
      id={value}
      value={value}  // important so your handler sees it
      type="checkbox"
      checked={checked}
      onChange={onChange}
      ...
    />
  </label>
);
```

## Related

- [core-listing-pages-logic.md](./core-listing-pages-logic.md)
- [categories-and-tags.md](../context/categories-and-tags.md)
