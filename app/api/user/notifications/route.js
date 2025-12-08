import { NextResponse } from "next/server";
import mongoose from "mongoose";
import db from "@/utils/db";
import Thank from "@/models/Thank";
import NameLike from "@/models/NameLike";
import DescriptionLike from "@/models/DescriptionLike";

import { leanWithStrings } from "@/utils/mongoDataCleanup";

import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";

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
    await db.connect();

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

    return NextResponse.json({
      names: nameLikes,
      descriptions: descriptionLikes,
      thanks: thanks,
    });
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
