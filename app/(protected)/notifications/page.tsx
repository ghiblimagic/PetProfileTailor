/**
 * Protected notifications page — server prefetch for names tab.
 * Notes: docs/notes/app/notifications-page.md
 */
import dbConnect from "@utils/db";
// necessary for populate
import Name from "@/models/Name";
import User from "@/models/User";
void Name;
void User;
import NameLike from "@/models/NameLike";
import { serverAuthOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ToggleOneNotificationPage from "@/components/Notifications/ToggleOneNotificationPage";
import PageTitleWithImages from "@/components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import { getPaginatedNotifications } from "@/utils/api/getPaginatedNotifications";
import type { NotificationTabConfig } from "@/components/Notifications/ToggleOneNotificationPage";

const contentList: NotificationTabConfig[] = [
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
