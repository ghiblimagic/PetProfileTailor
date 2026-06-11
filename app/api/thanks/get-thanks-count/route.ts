/**
 * Unread thank count for the signed-in content creator.
 * Notes: docs/notes/app/api/thanks-route.md
 */
import Thank from "@/models/Thank";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

export async function GET(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = auth.session.user.id;

  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  const count = await Thank.countDocuments({
    contentCreator: userId,
    read: false,
  });

  return Response.json({ count }, { status: 200 });
}
