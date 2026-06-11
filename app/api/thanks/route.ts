/**
 * Create and fetch thank-you notes on content.
 * Notes: docs/notes/app/api/thanks-route.md
 */
import dbConnect from "@utils/db";
// Register models for Mongoose populate
import "@/models/Name";
import "@/models/Description";
import "@/models/User";
import Thanks from "@/models/Thank";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import {
  checkIfValidContentType,
  isDescriptionsContentType,
} from "@/utils/api/checkIfValidContentType";

type ThanksCreateBody = {
  contentType: string;
  contentId: string;
  contentCreator: string;
  messages: string[];
};

export async function POST(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;

  await dbConnect.connect();

  try {
    const { contentType, contentCreator, contentId, messages } =
      (await req.json()) as ThanksCreateBody;

    if (!contentType || !contentId || !contentCreator || !messages) {
      return Response.json(
        {
          error:
            "Missing required parameter: contentType, contentId, contentCreator, messages",
        },
        { status: 400 },
      );
    }

    if (contentCreator === userId) {
      return Response.json(
        {
          message:
            "Nice try! But you cannot add a thank you note to your own content 😉",
        },
        { status: 400 },
      );
    }

    checkIfValidContentType(contentType);

    const nameId = contentType === "names" ? contentId : null;
    const descriptionId = isDescriptionsContentType(contentType)
      ? contentId
      : null;

    const existingThanksCount = await Thanks.countDocuments({
      thanksBy: userId,
      nameId,
      descriptionId,
    });

    if (existingThanksCount >= 10) {
      return Response.json(
        {
          message:
            "You have reached the maximum thank you notes for this content",
        },
        { status: 400 },
      );
    }

    const thanks = await Thanks.create({
      contentType,
      contentCreator,
      thanksBy: userId,
      nameId,
      descriptionId,
      messages,
    });

    return Response.json(
      {
        thanks,
        message: "Thanks successfully submitted, thank you!",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error creating thanks:", err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const userId = auth.session.user.id;

  try {
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get("contentType");
    const contentId = searchParams.get("contentId");

    if (!contentType || !contentId) {
      return Response.json(
        { error: "Missing contentType or contentId" },
        { status: 400 },
      );
    }

    checkIfValidContentType(contentType);

    const nameOrDescriptionId =
      contentType === "names" ? "nameId" : "descriptionId";

    const thanks = await leanWithStrings(
      Thanks.findOne({
        [nameOrDescriptionId]: contentId,
        thanksBy: userId,
      })
        .sort({ createdAt: -1 })
        .populate({ path: "contentCreator", select: ["name", "profileName"] })
        .populate({ path: "thanksBy", select: ["name", "profileName"] })
        .populate({ path: "nameId", select: ["content"] })
        .populate({ path: "descriptionId", select: ["content"] }),
    );

    if (!thanks) {
      return Response.json({ error: "Thanks not found" }, { status: 404 });
    }

    return Response.json({ thanks }, { status: 200 });
  } catch (err) {
    console.error("Error fetching thanks:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
