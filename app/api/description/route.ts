import dbConnect from "@utils/db";
import mongoose from "mongoose";
// necessary for populate
import DescriptionTag from "@/models/DescriptionTag";
import User from "@/models/User";
import Description from "@/models/Description";
void DescriptionTag;
void User;
import { checkOwnership } from "@/utils/api/checkOwnership";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import {
  checkMultipleFieldsBlocklist,
  respondIfBlocked,
} from "@/utils/api/checkMultipleBlocklists";
import normalizeString from "@/utils/stringManipulation/normalizeString";
import { findExactNormalized } from "@/utils/stringManipulation/findNormalizedMatch";
import {
  duplicateDescriptionConflict,
  shouldCheckDescriptionDuplicate,
} from "@/utils/api/descriptionDuplicateCheck";
type DescriptionContentRef = {
  content?: string | null;
};

type DescriptionCreateBody = {
  content: string;
  notes?: string;
  tags?: mongoose.Types.ObjectId[] | string[];
};

type DescriptionUpdateSubmission = {
  contentId: string;
  content?: string;
  notes?: string;
  tags?: mongoose.Types.ObjectId[] | string[];
};

type DescriptionUpdateBody = {
  submission: DescriptionUpdateSubmission;
};

type DescriptionDeleteBody = {
  contentId: string;
};

async function checkDuplicateDescription(
  content: string,
  existingDescription: DescriptionContentRef | null,
): Promise<Response | null> {
  if (
    shouldCheckDescriptionDuplicate(
      content,
      existingDescription?.content,
    )
  ) {
    const existingDescriptionCheck = await findExactNormalized(
      Description,
      content,
    );

    const conflict = duplicateDescriptionConflict(existingDescriptionCheck);
    if (conflict) {
      return Response.json(conflict, { status: 409 });
    }
  }
  return null;
}

// ############################ GET ################################################### //

export async function GET(_req: Request) {
  await dbConnect.connect();

  try {
    const descriptions = await Description.find()
      .populate({
        path: "createdBy",
        select: ["name", "profileName", "profileImage"],
      })
      .populate({ path: "tags", select: ["tag"] });

    return Response.json(descriptions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// ############################ POST ################################################### //

export async function POST(req: Request) {
  await dbConnect.connect();

  const body = (await req.json()) as DescriptionCreateBody;
  const { content, notes } = body;

  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const blockResult = checkMultipleFieldsBlocklist([
    { value: content, fieldName: "content" },
    { value: notes ?? "", fieldName: "notes" },
  ]);

  const errorResponse = respondIfBlocked(blockResult);
  if (errorResponse) return errorResponse;

  // ****************** checking for duplicates with snippet ****************************

  const existingMessage = await checkDuplicateDescription(content, {
    content: null,
  });
  if (existingMessage) return existingMessage;

  try {
    const newDescription = await Description.create({
      ...body,
      normalizedContent: normalizeString(content).slice(0, 400),
      createdBy: auth.session.user.id,
    });

    return Response.json(newDescription, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// ############################ PUT ################################################### //

export async function PUT(req: Request) {
  await dbConnect.connect();

  const body = (await req.json()) as DescriptionUpdateBody;
  const { notes, content, tags, contentId } = body.submission;
  const existingDescription = await Description.findById(contentId);

  // ************** content or notes checks *************************** //

  if (content || notes) {
    const blockResult = checkMultipleFieldsBlocklist([
      { value: content ?? "", fieldName: "content" },
      { value: notes ?? "", fieldName: "notes" },
    ]);

    const errorResponse = respondIfBlocked(blockResult);
    if (errorResponse) return errorResponse;

    const existingMessage = await checkDuplicateDescription(
      content ?? "",
      existingDescription,
    );
    if (existingMessage) return existingMessage;
  }

  // ************* checking ownership and updating ***************** //

  const { ok } = await checkOwnership({
    req,
    resourceCreatorId: existingDescription!.createdBy!,
  });
  if (!ok) return new Response("Unauthorized", { status: 401 });

  try {
    if (notes) existingDescription!.notes = notes;
    if (content) {
      (existingDescription!.content = content.trim()),
        (existingDescription!.normalizedContent = normalizeString(content).slice(
          0,
          400,
        ));
    }
    existingDescription!.tags = tags as mongoose.Types.ObjectId[];

    await existingDescription!.save();

    const updatedDescription = await Description.findById(contentId)
      .populate({
        path: "createdBy",
        select: "name profileName profileImage",
      })
      .populate({ path: "tags", select: "tag" });

    return Response.json({
      data: updatedDescription,
      message: "Description Updated",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// ############################ DELETE ################################################### //

export async function DELETE(req: Request) {
  await dbConnect.connect();

  const body = (await req.json()) as DescriptionDeleteBody;
  const contentId = body.contentId;

  try {
    const nameToBeDeleted = await Description.findById(
      new mongoose.Types.ObjectId(contentId),
    );

    const { ok } = await checkOwnership({
      req,
      resourceCreatorId: nameToBeDeleted!.createdBy!,
    });
    if (!ok) return new Response("Unauthorized", { status: 401 });

    await Description.deleteOne({ _id: contentId });

    return Response.json({ success: true, msg: `Description Deleted` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
