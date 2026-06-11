/**
 * Paginated thank notifications for the signed-in user.
 * Notes: docs/notes/app/api/notifications-routes.md
 */
import mongoose from "mongoose";
import dbConnect from "@utils/db";
// Register models for Mongoose populate
import "@/models/Description";
import "@/models/User";
import "@/models/Name";
import Thank from "@/models/Thank";
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

    const thankNotifs = await getPaginatedNotifications(
      Thank,
      { contentCreator: userId },
      [
        { path: "thanksBy", select: ["profileName", "profileImage", "name"] },
        { path: "nameId", select: ["content", "createdBy", "tags"] },
        { path: "descriptionId", select: ["content", "createdBy"] },
      ],
      { page, limit },
    );

    return Response.json(thankNotifs);
  } catch (err) {
    console.error("Error fetching thanks notifications:", err);
    return new Response("Failed to fetch thanks notifications", {
      status: 500,
    });
  }
}
