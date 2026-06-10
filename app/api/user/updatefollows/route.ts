/**
 * Toggle follow edge for the signed-in user. Notes: docs/notes/app/api/updatefollows-route.md
 */
import User from "@models/User";
import Follow from "@/models/Follow";
import dbConnect from "@utils/db";
import mongoose from "mongoose";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

type UpdateFollowBody = {
  userToFollowId: string;
  /** Current UI state from FollowButton — true means already following → unfollow */
  userFollowed: boolean;
};

export async function PUT(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const followerId = auth.session.user.id;

  await dbConnect.connect();
  const { userToFollowId, userFollowed } =
    (await req.json()) as UpdateFollowBody;

  const targetUser = await User.findById(
    new mongoose.Types.ObjectId(userToFollowId),
  );

  if (!targetUser) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  const userId = new mongoose.Types.ObjectId(userToFollowId);
  const followedBy = new mongoose.Types.ObjectId(followerId);

  // userFollowed = current UI state (true = already following → unfollow)
  if (userFollowed) {
    await Follow.deleteOne({ userId, followedBy });
  } else {
    await Follow.findOneAndUpdate(
      { userId, followedBy },
      {},
      { upsert: true, new: true },
    );
  }

  return Response.json({ message: "Followers updated" });
}
