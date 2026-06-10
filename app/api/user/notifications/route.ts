/**
 * Unread notification counts for nav badge + NotificationsProvider.
 * Notes: docs/notes/app/api/notifications-routes.md
 */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@utils/db";
import Thank from "@/models/Thank";
import NameLike from "@/models/NameLike";
import DescriptionLike from "@/models/DescriptionLike";
import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";

export type UserNotificationsCountsResponse = {
  names: number;
  descriptions: number;
  thanks: number;
};

export async function GET() {
  try {
    const session = await getServerSession(serverAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // console.log("session user id", session.user.id, typeof session.user.id);
    // console.log("userid mongoose", userId instanceof mongoose.Types.ObjectId);

    // console.log("userid in api/user/notifications", userId);
    await dbConnect.connect();

    // $ne on likedBy / thanksBy needs explicit ObjectId — same as list routes.
    //  Fetch in parallel
    const [descriptionLikes, nameLikes, thanks] = await Promise.all([
      DescriptionLike.countDocuments({
        contentCreator: userId,
        likedBy: { $ne: userId }, // only where likedBy is NOT equal to userId
        read: false,
      }),

      NameLike.countDocuments({
        contentCreator: userId,
        likedBy: { $ne: userId },
        read: false,
      }),

      Thank.countDocuments({
        contentCreator: userId,
        thanksBy: { $ne: userId },
        read: false,
      }),
    ]);
    console.log(
      "thanks",
      thanks,
      "nameLikes",
      nameLikes,
      "descriptionLikes",
      descriptionLikes,
    );

    const body: UserNotificationsCountsResponse = {
      names: nameLikes,
      descriptions: descriptionLikes,
      thanks: thanks,
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("Error fetching notification counts:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
