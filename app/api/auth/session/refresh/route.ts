/**
 * Refresh session user fields from Mongo (e.g. after avatar upload).
 * Notes: docs/notes/app/api/auth-session-refresh-route.md
 */
import { getServerSession } from "next-auth/next";
import { serverAuthOptions } from "@/lib/auth";
import db from "@utils/db";
import User from "@models/User";

export type SessionRefreshResponse = {
  id: string;
  name: string;
  profileName: string;
  profileImage: string;
  bio: string;
  location: string;
};

export async function POST() {
  const session = await getServerSession(serverAuthOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await db.connect();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const payload: SessionRefreshResponse = {
    id: user._id.toString(),
    name: user.name,
    profileName: user.profileName,
    profileImage: user.profileImage,
    bio: user.bio || "",
    location: user.location || "",
  };

  return Response.json(payload);
}
