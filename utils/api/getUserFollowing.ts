import type { Types } from "mongoose";
import Follow from "@/models/Follow";
import { leanWithStrings } from "@/utils/mongoDataCleanup";

export type FollowingUser = {
  _id: string;
  name?: string;
  profileName?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
};

type FollowEdge = {
  userId?: FollowingUser | string | null;
};

function isFollowingUser(value: unknown): value is FollowingUser {
  return (
    typeof value === "object" &&
    value != null &&
    "_id" in value &&
    typeof (value as FollowingUser)._id === "string"
  );
}

/** Users that `userId` follows — read from `follows` collection, not `User.followers`. */
export async function getUserFollowing(
  userId: Types.ObjectId | string,
): Promise<FollowingUser[]> {
  const edges =
    ((await leanWithStrings(
      Follow.find({ followedBy: userId }).populate({
        path: "userId",
        select: "name profileImage profileName bio location",
      }),
    )) as FollowEdge[] | null) ?? [];

  return edges.map((edge) => edge.userId).filter(isFollowingUser);
}
