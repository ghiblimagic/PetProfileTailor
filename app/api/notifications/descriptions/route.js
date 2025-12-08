import db from "@utils/db";
// necessary for populate
import Description from "@/models/Description";
import User from "@/models/User";
import DescriptionLike from "@/models/DescriptionLike";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { getPaginatedNotifications } from "@/utils/api/getPaginatedNotifications";
import mongoose from "mongoose";

export const GET = async (req) => {
  try {
    const { ok, session, response } = await getSessionForApis({ req });
    if (!ok) return response;

    const userId = new mongoose.Types.ObjectId(session.user.id);

    await db.connect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || 1);
    const limit = parseInt(searchParams.get("limit") || 25);

    const thankNotifs = await getPaginatedNotifications(
      DescriptionLike,
      { contentCreator: userId, likedBy: { $ne: userId } },
      [
        { path: "likedBy", select: ["profileName", "profileImage", "name"] },
        { path: "contentId", select: ["content", "createdBy", "tags"] },
      ],
      { page, limit },
    );

    return new Response(JSON.stringify(thankNotifs), { status: 200 });
  } catch (err) {
    console.error("Error fetching name likes notifications:", err);
    return new Response("Failed to fetch name likes notifications", {
      status: 500,
    });
  }
};
