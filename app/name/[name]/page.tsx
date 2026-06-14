/**
 * Single name detail page — lookup by URL slug / normalizedContent.
 * Notes: docs/notes/app/name-page.md
 */
import dbConnect from "@utils/db";
import Names from "@models/Name";
import { notFound } from "next/navigation";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import ContentListing from "@/components/ShowingListOfContent/ContentListing";
import ReturnToPreviousPage from "@/components/Shared/actions/ReturnToPreviousPage";
import type { ContentListingItem } from "@/components/ShowingListOfContent/ContentListing";

import "@/models/NameTag";

type NamePageProps = {
  params: Promise<{ name: string }>;
};

export default async function NamePage({ params }: NamePageProps) {
  const { name } = await params;
  const spaceAddedBackName = decodeURIComponent(name).replace(/\s+/g, "");
  // decodeURIComponent gets rid of %20, replaces with a space
  //   .replace(/\s+/g, "") takes care of any space/tabs/line breaks in the middle

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
    notFound(); // tells Next.js to show the 404 page
  }

  return (
    <div className="mx-2 mt-6">
      <ReturnToPreviousPage
        text="Go to fetch names"
        href="/fetchnames"
      />

      <ContentListing
        singleContent={nameData as unknown as ContentListingItem}
        dataType="names"
        mode="standalone"
        className="mt-4"
      />
    </div>
  );
}
