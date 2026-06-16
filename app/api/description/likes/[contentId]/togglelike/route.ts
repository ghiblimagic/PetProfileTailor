/**
 * Toggle like on a description (transaction). Notes: docs/notes/app/api/togglelike-route.md
 */
import dbConnect from "@/utils/db";
import mongoose from "mongoose";
import DescriptionLikes from "@/models/DescriptionLike";
import Description from "@/models/Description";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import {
  checkLikeToggleRateLimitForRequest,
  likeToggleRateLimitResponse,
} from "@/utils/api/likeToggleRateLimit";

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

  const rateCheck = checkLikeToggleRateLimitForRequest(likedBy, req);
  if (!rateCheck.allowed) {
    return likeToggleRateLimitResponse(rateCheck.resetTime);
  }

  const session = await mongoose.startSession();
  // console.log("toggle like api ran", { userId, descriptionId });

  try {
    session.startTransaction();
    // transaction to ensure likes count stay in sync, if both the collections aren't updated then cancel
    const existingLike = await DescriptionLikes.findOne({
      likedBy,
      contentId,
    }).session(session);

    let liked = false;

    if (existingLike) {
      // Unlike, delete the document, decrement likedByCount
      await DescriptionLikes.deleteOne({ _id: existingLike._id }).session(
        session,
      );
      await Description.updateOne(
        { _id: contentId },
        { $inc: { likedByCount: -1 } },
        { session },
      );
      liked = false;
    } else {
      // Like, insert the document, increment likedByCount
      const likingOwnContent = likedBy === creatorId;
      await DescriptionLikes.create(
        [
          {
            likedBy,
            contentCreator: creatorId,
            contentId,
            read: likingOwnContent,
          },
        ],
        { session },
      );
      await Description.updateOne(
        { _id: contentId },
        { $inc: { likedByCount: 1 } },
        { session },
      );
      liked = true;
    }

    await session.commitTransaction();
    return Response.json({ liked });
  } catch (err) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  } finally {
    session.endSession();
  }
}

export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}
