/**
 * Update signed-in user bio and location.
 * Notes: docs/notes/app/api/user-profile-routes.md
 */
import User from "@models/User";
import db from "@utils/db";
import mongoose from "mongoose";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

type BioLocationBody = {
  bioSubmission?: {
    bio?: string;
    location?: string;
  };
};

export async function PUT(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response(JSON.stringify({ message: "Not authenticated" }), {
      status: 401,
    });
  }

  const userId = auth.session.user.id;

  await db.connect();
  const { bio, location } = ((await req.json()) as BioLocationBody)
    .bioSubmission ?? {};

  const objectId = new mongoose.Types.ObjectId(userId);

  try {
    const user = await User.findById(objectId);
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    user.bio = bio ?? "";
    user.location = location ?? "";

    await user.save();

    return new Response(JSON.stringify({ message: "Profile updated" }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
