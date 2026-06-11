import type { Types } from "mongoose";
// Register User model for Mongoose populate
import "@/models/User";
import Follow from "@/models/Follow";
import { leanWithStrings } from "@/utils/mongoDataCleanup";

type FollowerUser = {
  _id: string;
  name?: string;
  profileName?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
};

type FollowEdge = {
  followedBy?: FollowerUser | string | null;
};

function isFollowerUser(value: unknown): value is FollowerUser {
  return (
    typeof value === "object" &&
    value != null &&
    "_id" in value &&
    typeof (value as FollowerUser)._id === "string"
  );
}

/** Followers for a user — read from `follows` collection, not `User`. */
export async function getUserFollowers(
  userId: Types.ObjectId | string,
): Promise<FollowerUser[]> {
  const edges =
    ((await leanWithStrings(
      Follow.find({ userId }).populate({
        path: "followedBy",
        select: "name profileImage profileName bio location",
      }),
    )) as FollowEdge[] | null) ?? [];

  return edges
    .map((edge) => edge.followedBy)
    .filter(isFollowerUser);
}
