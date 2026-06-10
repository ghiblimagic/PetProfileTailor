import dbConnect from "@utils/db";
import Thank from "@/models/Thank";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

export async function PATCH(req: Request) {
  // partial update
  // just updating an existing field, not creating anything
  // so this is a PATCH instead of a PUT
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const userId = auth.session.user.id;
  await dbConnect.connect();

  await Thank.updateMany(
    { contentCreator: userId, read: false },
    { $set: { read: true } },
  );

  return Response.json({ success: true });
}
