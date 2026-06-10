import dbConnect from "@utils/db";
import DescriptionLike from "@/models/DescriptionLike";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

export async function PATCH(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const userId = auth.session.user.id;
  await dbConnect.connect();

  await DescriptionLike.updateMany(
    { contentCreator: userId, read: false },
    { $set: { read: true } },
  );

  return Response.json({ success: true });
}
