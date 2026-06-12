/**
 * Public user profile by profileName + followers helper.
 * Notes: docs/notes/app/api/user-profile-routes.md
 */
import { getUserByProfileName } from "@utils/getUserByProfileName";
import User from "@/models/User";
import dbConnect from "@utils/db";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getUserFollowers } from "@/utils/api/getUserFollowers";

type RouteContext = {
  params: Promise<{ name: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  await dbConnect.connect();

  const { name } = await params;

  try {
    const user = await getUserByProfileName(name);

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const detailedUser = await leanWithStrings(
      User.findById(user.id).select(
        "name profileImage profileName bio location",
      ),
    );
    const followers = await getUserFollowers(user.id);

    return new Response(JSON.stringify({ ...detailedUser, followers }), {
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}
