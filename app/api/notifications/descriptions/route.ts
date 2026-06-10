/**
 * Paginated description-like notifications for the signed-in user.
 * Notes: docs/notes/app/api/notifications-routes.md
 */
import mongoose from "mongoose";
import dbConnect from "@utils/db";
// necessary for populate
import Description from "@/models/Description";
import User from "@/models/User";
import DescriptionLike from "@/models/DescriptionLike";
void Description;
void User;
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import {
  getPaginatedNotifications,
  parseNotificationPagination,
} from "@/utils/api/getPaginatedNotifications";

export async function GET(req: Request) {
  try {
    const auth = await getSessionForApis({ req });
    if (!auth.ok) return auth.response;

    const userId = new mongoose.Types.ObjectId(auth.session.user.id);

    await dbConnect.connect();

    const { searchParams } = new URL(req.url);
    const { page, limit } = parseNotificationPagination(searchParams);

    const descriptionNotifs = await getPaginatedNotifications(
      DescriptionLike,
      { contentCreator: userId, likedBy: { $ne: userId } },
      [
        { path: "likedBy", select: ["profileName", "profileImage", "name"] },
        { path: "contentId", select: ["content", "createdBy", "tags"] },
      ],
      { page, limit },
    );

    return Response.json(descriptionNotifs);
  } catch (err) {
    console.error("Error fetching name likes notifications:", err);
    return new Response("Failed to fetch name likes notifications", {
      status: 500,
    });
  }
}
