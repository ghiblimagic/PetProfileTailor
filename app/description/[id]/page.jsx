import React from "react";

import "@fortawesome/fontawesome-svg-core/styles.css";

import ContentListing from "@/components/ShowingListOfContent/ContentListing";
import dbConnect from "@utils/db";
import DescriptionTag from "@/models/DescriptionTag";
import Descriptions from "@/models/Description";
import { notFound } from "next/navigation";
const ObjectId = require("mongodb").ObjectId;
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import ReturnToPreviousPage from "@/components/ReusableSmallComponents/buttons/ReturnToPreviousPage";

export default async function Postid({ params }) {
  const { id } = await params;

  await dbConnect.connect();
  const descriptionId = ObjectId(id);

  let description = await leanWithStrings(
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
        singleContent={description}
        mode="standalone"
        className="mt-4"
      />
    </div>
  );
}
