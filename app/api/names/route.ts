import dbConnect from "@utils/db";
import mongoose from "mongoose";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";
import { checkOwnership } from "@/utils/api/checkOwnership";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import {
  checkMultipleFieldsBlocklist,
  respondIfBlocked,
} from "@/utils/api/checkMultipleBlocklists";
import normalizeString from "@/utils/stringManipulation/normalizeString";
import { findExactNormalized } from "@/utils/stringManipulation/findNormalizedMatch";
import {
  formatNameDuplicateMessage,
  formatNameInvalidCharsMessage,
  shouldRecheckNameDuplicateOnUpdate,
  shouldRunNameBlocklistOnUpdate,
  validateNameLength,
} from "@/utils/api/validateNameSubmission";
// Register models for Mongoose populate (tags, createdBy)
import "@/models/NameTag";
import "@/models/User";
import Names from "@models/Name";

type NameCreateBody = {
  content: string;
  notes?: string;
  tags?: mongoose.Types.ObjectId[] | string[];
};

type NameUpdateSubmission = {
  contentId: string;
  content: string;
  notes?: string;
  tags?: mongoose.Types.ObjectId[] | string[];
};

type NameUpdateBody = {
  submission: NameUpdateSubmission;
};

type NameDeleteBody = {
  contentId: string;
};

export async function GET(_req: Request) {
  await dbConnect.connect();

  console.log();

  try {
    const names = await Names.find()
      .populate({
        path: "createdBy",
        select: ["name", "profileName", "profileImage"],
      })
      .populate({ path: "tags", select: ["tag"] });

    return Response.json(names);
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect.connect();

  const auth = await getSessionForApis({ req });
  if (!auth.ok)
    return Response.json({ message: "Not authenticated" }, { status: 401 });

  const { content, notes, tags } = (await req.json()) as NameCreateBody;

  const lengthCheck = validateNameLength(content);
  if (!lengthCheck.ok) {
    return Response.json({ message: lengthCheck.message }, { status: 400 });
  }

  try {
    const blockResult = checkMultipleFieldsBlocklist([
      { value: content, fieldName: "content" },
      { value: notes ?? "", fieldName: "notes" },
    ]);

    const errorResponse = respondIfBlocked(blockResult);
    if (errorResponse) return errorResponse;

    const existingNameCheck = await findExactNormalized(Names, content);

    const invalidChars = regexInvalidInput(content);

    if (existingNameCheck) {
      return Response.json(
        {
          message: formatNameDuplicateMessage(content),
          existingName: existingNameCheck,
        },
        { status: 409 },
      );
    }

    if (invalidChars) {
      return Response.json(
        {
          message: formatNameInvalidCharsMessage(content, invalidChars),
        },
        { status: 400 },
      );
    }

    const normalizedString = normalizeString(content);

    const newName = await Names.create({
      content: content.trim(),
      normalizedContent: normalizedString,
      notes,
      tags,
      createdBy: auth.session.user.id,
    });

    return Response.json(newName, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// ######################### PUT ############################################## //

export async function PUT(req: Request) {
  await dbConnect.connect();

  const { submission } = (await req.json()) as NameUpdateBody;
  const { contentId, content, notes, tags } = submission;

  const lengthCheck = validateNameLength(content);
  if (!lengthCheck.ok) {
    return Response.json({ message: lengthCheck.message }, { status: 400 });
  }

  if (shouldRunNameBlocklistOnUpdate(content, notes)) {
    const blockResult = checkMultipleFieldsBlocklist([
      { value: content, fieldName: "content" },
      { value: notes ?? "", fieldName: "notes" },
    ]);

    const errorResponse = respondIfBlocked(blockResult);
    if (errorResponse) return errorResponse;
  }
  const toUpdateName = await Names.findById(contentId);
  if (!toUpdateName)
    return Response.json({ message: "Name not found" }, { status: 404 });

  const { ok } = await checkOwnership({
    req,
    res: null,
    resourceCreatorId: toUpdateName.createdBy,
  });
  if (!ok) return Response.json({ message: "Not authorized" }, { status: 403 });

  try {
    // if the content is changing, make sure it doesn't already exist
    if (shouldRecheckNameDuplicateOnUpdate(content, toUpdateName.content)) {
      const existingNameCheck = await findExactNormalized(Names, content);
      if (existingNameCheck) {
        return Response.json(
          { message: formatNameDuplicateMessage(content) },
          { status: 409 },
        );
      }
      const normalizedString = normalizeString(content);
      toUpdateName.content = content.trim();
      toUpdateName.normalizedContent = normalizedString;
    }

    if (notes) toUpdateName.notes = notes;
    if (tags) toUpdateName.tags = tags as mongoose.Types.ObjectId[];

    await toUpdateName.save();

    const populatedName = await Names.findById(contentId)
      .populate({ path: "createdBy", select: "name profileName profileImage" })
      .populate({ path: "tags", select: "tag" });

    return Response.json({ data: populatedName, message: "Name Updated" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await dbConnect.connect();

  try {
    const { contentId } = (await req.json()) as NameDeleteBody;
    const objectId = new mongoose.Types.ObjectId(contentId);
    await Names.deleteOne({ _id: objectId });

    return Response.json({ success: true, msg: `Name Deleted ${contentId}` });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
