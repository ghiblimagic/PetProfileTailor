# Description detail page

Source: [`app/description/[id]/page.tsx`](../../../app/description/[id]/page.tsx)

## Role

Public `/description/[id]` route — one description row via [`ContentListing`](../../../components/ShowingListOfContent/ContentListing.tsx) in **`mode="standalone"`**.

`id` is the MongoDB `_id` string (not normalized text like names).

## Params

```tsx
type DescriptionPageProps = {
  params: Promise<{ id: string }>;
};
```

## ObjectId validation

Replaces legacy `require("mongodb").ObjectId` — invalid ids 404 instead of throwing:

```tsx
if (!mongoose.Types.ObjectId.isValid(id)) {
  notFound();
}

const descriptionId = new mongoose.Types.ObjectId(id);
```

## Query

```tsx
await dbConnect.connect();

const description = await leanWithStrings(
  Descriptions.findById(descriptionId)
    .populate({
      path: "createdBy",
      select: ["name", "profileName", "profileImage"],
    })
    .populate({ path: "tags", select: ["tag"] }),
);

if (!description) {
  notFound();
}
```

- **`import "@/models/DescriptionTag"`** — register model for `tags` populate only.
- Removed page-level `@fortawesome/fontawesome-svg-core/styles.css` — child client components (e.g. `LikesButtonAndLikesLogic`) import it where needed.

## Render

```tsx
<ReturnToPreviousPage
  text="Go to fetch descriptions"
  href="/fetchdescriptions"
/>

<ContentListing
  dataType="descriptions"
  singleContent={singleContent}
  mode="standalone"
  className="mt-4"
/>
```

## Related

- [content-listing.md](../components/content-listing.md)
- [name-and-description.md](../models/name-and-description.md)
- [fetchdescriptions-page.md](./fetchdescriptions-page.md)
