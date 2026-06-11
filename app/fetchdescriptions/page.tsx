/**
 * Public descriptions listing — filterable paginated browse.
 * Notes: docs/notes/app/fetchdescriptions-page.md
 */
import dbConnect from "@utils/db";
import CoreListingPageLogic from "@/components/CoreListingPagesLogic";

export default async function FetchDescriptionsPage() {
  await dbConnect.connect();

  return <CoreListingPageLogic dataType="descriptions" />;
}
