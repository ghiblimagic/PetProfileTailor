/**
 * Paginated name-like notifications for the signed-in user.
 * Notes: docs/notes/app/api/notifications-routes.md
 */
import mongoose from "mongoose";
import dbConnect from "@utils/db";
// Register models for Mongoose populate
import "@/models/Name";
import "@/models/User";
import NameLike from "@/models/NameLike";
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
    // was failing with $ne: userId
    // found out ne doesn't automatically cast the type to objectId

    // Mongoose knows contentCreator is an ObjectId field, so it automatically casts userId (even if it's a string) into an ObjectId for you.
    // query operators like $ne, $in, $nin, $gte, etc., Mongoose can't always infer the expected type cleanly
    // So it skips automatic casting for safety — you have to pass an ObjectId yourself.

    await dbConnect.connect();

    const { searchParams } = new URL(req.url);
    const { page, limit } = parseNotificationPagination(searchParams);

    const nameNotifs = await getPaginatedNotifications(
      NameLike,
      {
        contentCreator: userId,
        likedBy: { $ne: userId },
      },
      [
        { path: "likedBy", select: ["profileName", "profileImage", "name"] },
        { path: "contentId", select: ["content", "createdBy", "tags"] },
      ],
      { page, limit },
    );

    return Response.json(nameNotifs);
  } catch (err) {
    console.error("Error fetching name likes notifications:", err);
    return new Response("Failed to fetch name likes notifications", {
      status: 500,
    });
  }
}
