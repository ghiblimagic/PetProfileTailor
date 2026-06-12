/**
 * User + populated followers by display name field.
 * Notes: docs/notes/app/api/user-profile-routes.md
 */
import dbConnect from "@utils/db";
import Users from "@models/User";

type RouteContext = {
  params: Promise<{ name: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  await dbConnect.connect();

  const { name } = await params;

  try {
    const user = await Users.findOne({ name })
      .select("name followers profileImage profileName bio location")
      .populate("followers", "name profileName profileImage");

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}
