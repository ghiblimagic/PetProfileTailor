# Name detail page

Source: [`app/name/[name]/page.tsx`](../../../app/name/[name]/page.tsx)

## Role

Public `/name/[name]` route — one name row via [`ContentListing`](../../../components/ShowingListOfContent/ContentListing.tsx) in **`mode="standalone"`** (no SWR `mutate`).

Linked from listing rows, share URLs, duplicate-check results.

## Params

```tsx
type NamePageProps = {
  params: Promise<{ name: string }>;
};
```

URL segment is decoded and whitespace-stripped before DB lookup:

```tsx
const { name } = await params;
const spaceAddedBackName = decodeURIComponent(name).replace(/\s+/g, "");
// decodeURIComponent gets rid of %20, replaces with a space
//   .replace(/\s+/g, "") takes care of any space/tabs/line breaks in the middle
```

## Query

```tsx
await dbConnect.connect();

const nameData = await leanWithStrings(
  Names.findOne({
    normalizedContent: spaceAddedBackName, // Direct match
  })
    .collation({ locale: "en", strength: 2 }) // strength: 2 = case-insensitive
    .populate({
      path: "createdBy",
      select: ["name", "profileName", "profileImage"],
    })
    .populate({ path: "tags", select: ["tag"] }),
);

if (!nameData) {
  notFound();
}
```

- **`normalizedContent`** — stored normalized form of the name (see [`findNormalizedMatch`](../../../utils/stringManipulation/findNormalizedMatch.ts)).
- **`collation` strength 2** — case-insensitive match on the normalized slug.
- **`import "@/models/NameTag"`** — register model for `tags` populate only.

## Render

```tsx
<ReturnToPreviousPage text="Go to fetch names" href="/fetchnames" />

<ContentListing
  singleContent={singleContent}
  dataType="names"
  mode="standalone"
  className="mt-4"
/>
```

## Related

- [content-listing.md](../components/content-listing.md)
- [name-and-description.md](../models/name-and-description.md)
- [fetchnames-page.md](./fetchnames-page.md)
