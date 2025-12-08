import { getServerSession } from "next-auth/next";
import { serverAuthOptions } from "@/lib/auth";
import db from "@utils/db";
import User from "@models/User";

export async function POST(req) {
  const session = await getServerSession(serverAuthOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  await db.connect();
  const user = await User.findById(session.user.id).lean();

  if (!user) return new Response("User not found", { status: 404 });
  console.log("user in session refresh", user);
  // Return a fresh session-like payload
  return Response.json({
    id: user._id,
    name: user.name,
    profileName: user.profileName,
    profileImage: user.profileImage,
    bio: user.bio || "",
    location: user.location || "",
  });
}
