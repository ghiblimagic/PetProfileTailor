/**
 * Add-description page shell — title + `addingdescription` form.
 * Notes: docs/notes/app/adddescriptions-page.md
 */
import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import AddingDescription from "@components/AddingNewData/addingdescription";

export default function AddDescriptionsPage() {
  return (
    <div>
      <PageTitleWithImages title="Add a" title2="Description" />
      <AddingDescription />
    </div>
  );
}
