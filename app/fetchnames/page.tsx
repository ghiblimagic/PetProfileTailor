/**
 * Public names listing — filterable paginated browse.
 * Notes: docs/notes/app/fetchnames-page.md
 */
import dbConnect from "@utils/db";
import CoreListingPageLogic from "@/components/CoreListingPagesLogic";

export default async function FetchNamesPage() {
  await dbConnect.connect();

  return <CoreListingPageLogic dataType="names" />;
}
