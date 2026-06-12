/**
 * Public user profile by Mongo id.
 * Notes: docs/notes/app/api/user-profile-routes.md
 */
import dbConnect from "@utils/db";
import Users from "@models/User";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  await dbConnect.connect();
  const { id } = await params;

  try {
    const userId = new ObjectId(id);

    const user = await Users.findById(userId).select(
      "name followers profileImage profileName bio location",
    );

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
