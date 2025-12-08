import dbConnect from "@utils/db";

import User from "@/models/User";
import Name from "@/models/Name";
import Description from "@/models/Description";

import Thank from "@/models/Thank";
import NameLike from "@/models/NameLike";
import { serverAuthOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import ToggleOneNotificationPage from "@/components/Notifications/ToggleOneNotificationPage";
import PageTitleWithImages from "@/components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import MarkThanksRead from "@/components/Thanks/markThanksRead";
import { getPaginatedNotifications } from "@/utils/api/getPaginatedNotifications";

export default async function Notifications() {
  const session = await getServerSession(serverAuthOptions);

  if (!session?.user) {
    return redirect("/login");
  }
  const userId = session.user.id;

  await dbConnect.connect();

  const nameDocs = await getPaginatedNotifications(
    NameLike,
    { contentCreator: userId },
    [
      { path: "likedBy", select: ["profileName", "profileImage", "name"] },
      { path: "contentId", select: ["content", "createdBy", "tags"] },
    ],
    { page: 1, limit: 25 },
  );

  // console.log("name docs", nameDocs);

  const contentList = [
    {
      text: "Names",
      className: "mb-2",
      value: "names",
      type: "names",
      icon: "faHeart",
    },
    {
      text: "Descriptions",
      className: "mb-2",
      value: "descriptions",
      type: "descriptions",
      icon: "faHeart",
    },
    {
      text: "Thanks",
      className: "mb-2",
      value: "thanks",
      type: "thanks",
      icon: "thanks",
    },
  ];

  return (
    <div>
      <PageTitleWithImages title="Notifications" />
      <section className="text-subtleWhite flex justify-center items-center h-full">
        <ToggleOneNotificationPage
          contentList={contentList}
          initialNamesDocs={nameDocs}
        />
        {/* <MarkThanksRead /> */}
      </section>
    </div>
  );
}

// thanks , names , descriptions
