/**
 * Fetch current user's liked name/description ids (server + API route).
 * Notes: docs/notes/app/api/user-likes-route.md
 */
import mongoose from "mongoose";
import dbConnect from "@utils/db";
import NameLike from "@/models/NameLike";
import DescriptionLike from "@/models/DescriptionLike";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import type { UserLikeEntry, UserLikesResponse } from "./userLikesResponse";

export type { UserLikeEntry, UserLikesResponse } from "./userLikesResponse";
export { buildLikesMapsFromResponse } from "./userLikesResponse";

function toLikeEntries(
  docs: Array<{ _id: string; contentId: string }>,
): UserLikeEntry[] {
  return docs.map((d) => ({ id: d._id, contentId: d.contentId }));
}

export async function getUserLikesForUserId(
  userId: string,
): Promise<UserLikesResponse> {
  const likedBy = new mongoose.Types.ObjectId(userId);

  await dbConnect.connect();

  // Run the queries in parallel (same as original GET /api/user/likes route)
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

  return {
    names: nameLikes,
    descriptions: descriptionLikes,
  };
}
