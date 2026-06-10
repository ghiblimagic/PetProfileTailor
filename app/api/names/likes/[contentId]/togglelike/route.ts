/**
 * Toggle like on a name (transaction). Notes: docs/notes/app/api/togglelike-route.md
 */
import dbConnect from "@/utils/db";
import mongoose from "mongoose";
import NameLikes from "@/models/NameLike";
import Names from "@/models/Name";
import { getSessionForApis } from "@/utils/api/getSessionForApis";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

type ToggleLikeBody = {
  contentCreator: {
    _id: string;
    name?: string;
    profileName?: string;
    profileImage?: string;
  };
};

export async function POST(req: Request, { params }: RouteContext) {
  await dbConnect.connect();

  const { contentId } = await params;

  const body = (await req.json()) as ToggleLikeBody;
  const { _id } = body.contentCreator;

  const creatorId = _id;

  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const likedBy = auth.session.user.id;

  if (!likedBy) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();
    // transaction to ensure likes count stay in sync, if both the collections aren't updated then cancel

    const existingLike = await NameLikes.findOne({
      likedBy,
      contentId,
    }).session(dbSession);

    // console.log("existing like worked", existingLike);

    let liked = false;

    if (existingLike) {
      // Unlike, delete the document, decrement likedByCount
      await NameLikes.deleteOne({ _id: existingLike._id }).session(dbSession);
      await Names.updateOne(
        { _id: contentId },
        { $inc: { likedByCount: -1 } },
        { session: dbSession },
      );
      liked = false;
    } else {
      // Like, insert the document, increment likedByCount
      const likingOwnContent = likedBy === creatorId;
      // console.log(
      //   "likngOwnContent",
      //   likingOwnContent,
      //   "likedBy",
      //   likedBy,
      //   "contentCreator._id",
      //   creatorId,
      // );
      await NameLikes.create(
        [
          {
            likedBy,
            contentCreator: creatorId,
            contentId,
            read: likingOwnContent,
          },
        ],
        {
          session: dbSession,
        },
      );
      await Names.updateOne(
        { _id: contentId },
        { $inc: { likedByCount: 1 } },
        { session: dbSession },
      );
      liked = true;
    }

    await dbSession.commitTransaction();

    return Response.json({ liked });
  } catch (err) {
    await dbSession.abortTransaction();
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
