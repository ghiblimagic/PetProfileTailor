import User from "@models/User";
import Follow from "@/models/Follow";
import db from "@utils/db";
import mongoose from "mongoose";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

export async function PUT(req) {
  const { ok, session } = await getSessionForApis({ req });
  if (!ok) {
    return new Response(JSON.stringify({ message: "Not authenticated" }), {
      status: 401,
    });
  }

  const followerId = session.user.id;

  await db.connect();
  const body = await req.json();
  const { userToFollowId, userFollowed } = body;

  const targetUser = await User.findById(
    mongoose.Types.ObjectId(userToFollowId),
  );

  if (!targetUser) {
    return new Response(JSON.stringify({ message: "User not found" }), {
      status: 404,
    });
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

  return new Response(JSON.stringify({ message: "Followers updated" }), {
    status: 200,
  });
}
