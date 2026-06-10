/**
 * Current user's liked name/description ids for LikesContext.
 * Notes: docs/notes/app/api/user-likes-route.md
 */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@utils/db";
import NameLike from "@/models/NameLike";
import DescriptionLike from "@/models/DescriptionLike";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";

export type UserLikeEntry = {
  id: string;
  contentId: string;
};

export type UserLikesResponse = {
  names: UserLikeEntry[];
  descriptions: UserLikeEntry[];
};

function toLikeEntries(
  docs: Array<{ _id: string; contentId: string }>,
): UserLikeEntry[] {
  return docs.map((d) => ({ id: d._id, contentId: d.contentId }));
}

export async function GET() {
  try {
    // 🔑 Get the current user session
    const session = await getServerSession(serverAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const likedBy = new mongoose.Types.ObjectId(session.user.id);

    await dbConnect.connect();

    // Run the queries in parallel
    const [nameLikes, descriptionLikes] = await Promise.all([
      leanWithStrings(
        NameLike.find({ likedBy }, { contentId: 1, _id: 1 }),
      ).then((docs) =>
        toLikeEntries(
          (docs ?? []) as Array<{ _id: string; contentId: string }>,
        ),
      ),
      leanWithStrings(
        DescriptionLike.find({ likedBy }, { contentId: 1, _id: 1 }),
      ).then((docs) =>
        toLikeEntries(
          (docs ?? []) as Array<{ _id: string; contentId: string }>,
        ),
      ),
    ]);

    const body: UserLikesResponse = {
      names: nameLikes,
      descriptions: descriptionLikes,
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("Error fetching likes:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
