import dbConnect from "@utils/db";
import NameTag from "@/models/NameTag";
import Names from "@models/Name";
import { notFound } from "next/navigation";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import ContentListing from "@/components/ShowingListOfContent/ContentListing";

import ReturnToPreviousPage from "@/components/ReusableSmallComponents/buttons/ReturnToPreviousPage";

export default async function Postid({ params }) {
  const { name } = await params;
  const spaceAddedBackName = decodeURIComponent(name).replace(/\s+/g, "");
  // decodeURIComponent gets rid of %20, replaces with a space
  //   .replace(/\s+/g, "") takes care of any space/tabs/line breaks in the middle

  console.log("name from params", name, "params", params);
  console.log(`${spaceAddedBackName} spaceAddedBackName`);

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

  console.log("nameData", nameData);

  if (!nameData) {
    notFound(); // tells Next.js to show the 404 page
  }

  return (
    <div className="mx-2 mt-6">
      <ReturnToPreviousPage
        text="Go to fetch names"
        href="/fetchnames"
      />

      {nameData && (
        <ContentListing
          singleContent={nameData}
          dataType="names"
          mode="local"
          className="mt-4"
        />
      )}
    </div>
  );
}
