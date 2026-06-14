/**
 * Single description detail page — lookup by Mongo _id.
 * Notes: docs/notes/app/description-page.md
 */
import mongoose from "mongoose";
import ContentListing from "@/components/ShowingListOfContent/ContentListing";
import dbConnect from "@utils/db";
import Descriptions from "@/models/Description";
import { notFound } from "next/navigation";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import ReturnToPreviousPage from "@/components/Shared/actions/ReturnToPreviousPage";
import type { ContentListingItem } from "@/components/ShowingListOfContent/ContentListing";

import "@/models/DescriptionTag";

type DescriptionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DescriptionPage({ params }: DescriptionPageProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  await dbConnect.connect();
  const descriptionId = new mongoose.Types.ObjectId(id);

  const description = await leanWithStrings(
    Descriptions.findById(descriptionId)
      .populate({
        path: "createdBy",
        select: ["name", "profileName", "profileImage"],
      })
      .populate({ path: "tags", select: ["tag"] }),
  );

  // console.log(description, "description");
  if (!description) {
    notFound();
  }

  return (
    <div className="mx-2">
      <ReturnToPreviousPage
        text="Go to fetch descriptions"
        href="/fetchdescriptions"
      />

      <ContentListing
        dataType="descriptions"
        singleContent={description as unknown as ContentListingItem}
        mode="standalone"
        className="mt-4"
      />
    </div>
  );
}
