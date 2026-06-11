/**
 * Create, fetch, update, and delete user suggestions.
 * Notes: docs/notes/app/api/suggestion-route.md
 */
import dbConnect from "@utils/db";
import NameTag from "@/models/NameTag";
import DescriptionTag from "@/models/DescriptionTag";
void NameTag;
void DescriptionTag;
import Suggestion from "@/models/Suggestion";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { checkOwnership } from "@/utils/api/checkOwnership";
import convertStringToMongooseId from "@/utils/stringManipulation/convertStringToMongooseId";
import { NextResponse } from "next/server";
import type { Types } from "mongoose";
import { isDescriptionsContentType } from "@/utils/api/checkIfValidContentType";

type SuggestionCreateBody = {
  contentType: string;
  contentId: string;
  contentCreator: string;
  incorrectTags?: string[];
  comments?: string;
  description?: string;
  tags?: string[];
};

type SuggestionUpdateBody = {
  contentType: string;
  suggestionId: string;
  incorrectTags?: string[];
  description?: string;
  tags?: string[];
  comments?: string;
};

type SuggestionDeleteBody = {
  suggestionId: string;
};

export async function POST(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const userId = auth.session.user.id;
  const {
    contentType,
    contentId,
    contentCreator,
    incorrectTags = [],
    comments,
    description,
    tags = [],
  } = (await req.json()) as SuggestionCreateBody;

  if (contentCreator === userId) {
    return NextResponse.json(
      { message: "You cannot add a suggestion to your own content" },
      { status: 400 },
    );
  }

  const existingSuggestion = await Suggestion.findOne({
    suggestionBy: userId,
    contentId,
    status: { $nin: ["dismissed", "deleted", "resolved"] },
  });

  if (existingSuggestion) {
    return NextResponse.json(
      {
        message:
          "You cannot add a suggestion to this content again until the current suggestion is resolved",
      },
      { status: 400 },
    );
  }

  try {
    const nameTagsSuggested = contentType === "names" ? tags : [];
    const descriptionTagsSuggested = isDescriptionsContentType(contentType)
      ? tags
      : [];
    const incorrectNameTags = contentType === "names" ? incorrectTags : [];
    const incorrectDescriptionTags = isDescriptionsContentType(contentType)
      ? incorrectTags
      : [];

    const suggestion = await Suggestion.create({
      contentType,
      contentId,
      contentCreator,
      suggestionBy: userId,
      incorrectNameTags: convertStringToMongooseId(incorrectNameTags),
      incorrectDescriptionTags: convertStringToMongooseId(
        incorrectDescriptionTags,
      ),
      description,
      comments,
      nameTagsSuggested,
      descriptionTagsSuggested,
    });

    return NextResponse.json(
      { suggestion, message: "Suggestion successfully submitted, thank you!" },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const userId = auth.session.user.id;
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const status = searchParams.get("status");

  try {
    const suggestion = await leanWithStrings(
      Suggestion.findOne({
        contentId,
        suggestionBy: userId,
        ...(status ? { status } : {}),
      })
        .sort({ createdAt: -1 })
        .populate({ path: "nameTagsSuggested", select: ["tag"] })
        .populate({ path: "descriptionTagsSuggested", select: ["tag"] }),
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ suggestion }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const {
    contentType,
    suggestionId,
    incorrectTags = [],
    description,
    tags = [],
    comments,
  } = (await req.json()) as SuggestionUpdateBody;

  try {
    const existingSuggestion = await Suggestion.findById(suggestionId);
    if (!existingSuggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 },
      );
    }

    const ownership = await checkOwnership({
      req,
      resourceCreatorId: existingSuggestion.suggestionBy.toString(),
    });
    if (!ownership.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nameTagsSuggested =
      existingSuggestion.contentType === "names" ? tags : [];
    const descriptionTagsSuggested = isDescriptionsContentType(
      existingSuggestion.contentType,
    )
      ? tags
      : [];

    const incorrectNameTags = contentType === "names" ? incorrectTags : [];
    const incorrectDescriptionTags = isDescriptionsContentType(contentType)
      ? incorrectTags
      : [];

    existingSuggestion.comments = comments;
    existingSuggestion.description = description;
    existingSuggestion.nameTagsSuggested = convertStringToMongooseId(
      nameTagsSuggested,
    ) as Types.ObjectId[];
    existingSuggestion.descriptionTagsSuggested = convertStringToMongooseId(
      descriptionTagsSuggested,
    ) as Types.ObjectId[];
    existingSuggestion.incorrectNameTags = convertStringToMongooseId(
      incorrectNameTags,
    ) as Types.ObjectId[];
    existingSuggestion.incorrectDescriptionTags = convertStringToMongooseId(
      incorrectDescriptionTags,
    ) as Types.ObjectId[];

    const updatedSuggestion = await existingSuggestion.save();

    return NextResponse.json(
      { message: "Suggestion updated", updatedSuggestion },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await getSessionForApis({ req });
  if (!auth.ok) return auth.response;

  await dbConnect.connect();

  const { suggestionId } = (await req.json()) as SuggestionDeleteBody;

  try {
    const contentToDelete = await Suggestion.findById(suggestionId);
    if (!contentToDelete) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 },
      );
    }

    const ownership = await checkOwnership({
      req,
      resourceCreatorId: contentToDelete.suggestionBy.toString(),
    });
    if (!ownership.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    contentToDelete.status = "deleted";
    contentToDelete.outcome = "deletedByUser";

    await contentToDelete.save();

    return NextResponse.json(
      { message: "Suggestion deleted" },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
