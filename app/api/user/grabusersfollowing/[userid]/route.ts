/**
 * List users that a given user follows. Notes: docs/notes/app/api/grabusersfollowing-route.md
 */
import dbConnect from "@utils/db";
import { getUserFollowing } from "@/utils/api/getUserFollowing";

type RouteContext = {
  params: Promise<{ userid: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  await dbConnect.connect();
  const { userid } = await params;

  try {
    const usersFollowing = await getUserFollowing(userid);
    return Response.json(usersFollowing);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
