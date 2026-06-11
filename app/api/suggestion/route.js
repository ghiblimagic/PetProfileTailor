import db from "@utils/db";
import NameTag from "@/models/NameTag";
import DescriptionTag from "@/models/DescriptionTag";
import Suggestion from "@/models/Suggestion";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { checkOwnership } from "@/utils/api/checkOwnership";
import convertStringToMongooseId from "@/utils/stringManipulation/convertStringToMongooseId";
import { NextResponse } from "next/server";
import { isDescriptionsContentType } from "@/utils/api/checkIfValidContentType";

// Shared auth helper
async function requireAuth(req) {
  const { ok, session, res } = await getSessionForApis({ req });
  if (!ok) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session };
}

// ---------------- POST (create a suggestion) ----------------
export async function POST(req) {
  const { session, error } = await requireAuth(req);
  if (error) return error;

  await db.connect();

  const userId = session.user.id;
  const {
    contentType,
    contentId,
    contentCreator,
    incorrectTags,
    comments,
    description,
    tags,
  } = await req.json();

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

// ---------------- GET (fetch suggestion) ----------------
export async function GET(req) {
  const { session, error } = await requireAuth(req);
  if (error) return error;

  await db.connect();

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const status = searchParams.get("status");

  try {
    const suggestion = await leanWithStrings(
      Suggestion.findOne({
        contentId,
        suggestionBy: userId,
        ...(status && { status }),
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

// ---------------- PUT (update suggestion) ----------------
export async function PUT(req) {
  const { session, error } = await requireAuth(req);
  if (error) return error;

  await db.connect();

  const userId = session.user.id;
  const {
    contentType,
    suggestionId,
    incorrectTags,
    description,
    tags,
    comments,
  } = await req.json();

  try {
    const existingSuggestion = await Suggestion.findById(suggestionId);
    if (!existingSuggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 },
      );
    }

    const { ok } = await checkOwnership({
      req,
      resourceCreatorId: existingSuggestion.suggestionBy.toString(),
    });
    if (!ok) {
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
    existingSuggestion.nameTagsSuggested = nameTagsSuggested;
    existingSuggestion.descriptionTagsSuggested = descriptionTagsSuggested;
    existingSuggestion.incorrectNameTags =
      convertStringToMongooseId(incorrectNameTags);
    existingSuggestion.incorrectDescriptionTags = convertStringToMongooseId(
      incorrectDescriptionTags,
    );

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

// ---------------- DELETE (mark as deleted) ----------------
export async function DELETE(req) {
  const { session, error } = await requireAuth(req);
  if (error) return error;

  await db.connect();

  const { suggestionId } = await req.json();

  try {
    const contentToDelete = await Suggestion.findById(suggestionId);
    if (!contentToDelete) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 },
      );
    }

    const ownershipCheck = await checkOwnership({
      req,
      resourceCreatorId: contentToDelete.suggestionBy.toString(),
    });
    if (!ownershipCheck) {
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

// import db from "@utils/db";
// import Suggestion from "@/models/Suggestion";
// import mongoose from "mongoose";
// import { leanWithStrings } from "@/utils/mongoDataCleanup";
// import { getSessionForApis } from "@/utils/api/getSessionForApis";
// import { checkOwnership } from "@/utils/api/checkOwnership";
// import convertStringToMongooseId from "@/utils/api/convertStringToMongooseId";

// export default async function handler(req, res) {
//   const { method } = req;

//   await db.connect();

//   // Get session (authentication)
//   const { ok, session } = await getSessionForApis({ req, res });
//   if (!ok) {
//     return;
//   }

//   const userId = session.user.id;

//   // ---------------- POST (create a suggestion) ----------------
//   if (method === "POST") {
//     const {
//       contentType,
//       contentId,
//       contentCreator,
//       incorrectTags,
//       comments,
//       description,
//       tags,
//     } = req.body;

//     console.log("req.body for suggestions", req.body);

//     if (contentCreator === userId) {
//       return res.status(400).json({
//         message: "You cannot add a suggestion to your own content",
//       });
//     }

//     const existingSuggestion = await Suggestion.findOne({
//       suggestionBy: userId,
//       contentId,
//       status: { $nin: ["dismissed", "deleted", "resolved"] },
//     });

//     if (existingSuggestion) {
//       return res.status(400).json({
//         message:
//           "You cannot add a suggestion to this content again until the current suggestion is resolved",
//       });
//     }

//     try {
//       const nameTagsSuggested = contentType === "names" ? tags : [];
//       const descriptionTagsSuggested =
//         contentType === "description" ? tags : [];

//       const incorrectNameTags = contentType === "names" ? incorrectTags : [];
//       const incorrectDescriptionTags =
//         contentType === "description" ? incorrectTags : [];

//       const suggestion = await Suggestion.create({
//         contentType,
//         contentId,
//         contentCreator,
//         suggestionBy: userId,
//         incorrectNameTags: convertStringToMongooseId(incorrectNameTags),
//         incorrectDescriptionTags: convertStringToMongooseId(
//           incorrectDescriptionTags,
//         ),
//         description,
//         comments,
//         nameTagsSuggested,
//         descriptionTagsSuggested,
//       });

//       return res.status(201).json({
//         suggestion,
//         message: "Suggestion successfully submitted, thank you!",
//       });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ message: "Server error" });
//     }
//   }

//   // ---------------- GET (fetch suggestion) ----------------
//   if (method === "GET") {
//     try {
//       const { contentId, status } = req.query;

//       const suggestion = await leanWithStrings(
//         Suggestion.findOne({
//           contentId: contentId,
//           suggestionBy: userId,
//           ...(status && { status }),
//         })
//           .sort({ createdAt: -1 })
//           .populate({ path: "nameTagsSuggested", select: ["tag"] })
//           .populate({ path: "descriptionTagsSuggested", select: ["tag"] }),
//       );

//       if (!suggestion) {
//         return res.status(404).json({ error: "Suggestion not found" });
//       }

//       return res.status(200).json({ suggestion });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ error: "Server error" });
//     }
//   }

//   // ---------------- PUT (update suggestion) ----------------
//   if (method === "PUT") {
//     try {
//       const {
//         contentType,
//         contentId,
//         suggestionId,
//         incorrectTags,
//         description,
//         tags,
//         comments,
//       } = req.body;

//       console.log("put request body", req.body);

//       const existingSuggestion = await Suggestion.findById(suggestionId);

//       if (!existingSuggestion)
//         return res.status(404).json({ error: "Suggestion not found" });

//       const { ok } = await checkOwnership({
//         req,
//         res,
//         resourceCreatorId: existingSuggestion.suggestionBy.toString(),
//       });
//       if (!ok) {
//         return;
//       }

//       const nameTagsSuggested =
//         existingSuggestion.contentType === "names" ? tags : [];
//       const descriptionTagsSuggested =
//         existingSuggestion.contentType === "description" ? tags : [];

//       const incorrectNameTags = contentType === "names" ? incorrectTags : [];
//       const incorrectDescriptionTags =
//         contentType === "description" ? incorrectTags : [];

//       existingSuggestion.comments = comments;
//       existingSuggestion.description = description;

//       existingSuggestion.nameTagsSuggested = nameTagsSuggested;
//       existingSuggestion.descriptionTagsSuggested = descriptionTagsSuggested;

//       existingSuggestion.incorrectNameTags =
//         convertStringToMongooseId(incorrectNameTags);
//       existingSuggestion.incorrectDescriptionTags = convertStringToMongooseId(
//         incorrectDescriptionTags,
//       );

//       const updatedSuggestion = await existingSuggestion.save();

//       return res
//         .status(200)
//         .json({ message: "Suggestion updated", updatedSuggestion });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ error: "Server error" });
//     }
//   }

//   // ---------------- DELETE (mark as deleted) ----------------
//   if (method === "DELETE") {
//     try {
//       const { suggestionId } = req.body;

//       const contentToDelete = await Suggestion.findById(suggestionId);

//       if (!contentToDelete)
//         return res.status(404).json({ error: "Suggestion not found" });

//       const deletionOwnershipCheck = await checkOwnership({
//         req,
//         res,
//         resourceCreatorId: contentToDelete.suggestionBy.toString(),
//       });
//       if (!deletionOwnershipCheck) return null;

//       contentToDelete.status = "deleted";
//       contentToDelete.outcome = "deletedByUser";

//       await contentToDelete.save();

//       return res.status(200).json({ message: "Suggestion deleted" });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ error: "Server error" });
//     }
//   }

//   return res.status(405).json({ error: "Method not allowed" });
// }
