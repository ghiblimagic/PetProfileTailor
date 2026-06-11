/**
 * Live duplicate / validation check while adding a name.
 * Notes: docs/notes/app/api/check-if-content-exists.md
 */
import dbConnect from "@utils/db";
// Register models for Mongoose populate
import "@/models/NameTag";
import "@/models/User";
import Names from "@models/Name";
import {
  checkMultipleFieldsBlocklist,
  respondIfBlocked,
} from "@/utils/api/checkMultipleBlocklists";
import normalizeString from "@/utils/stringManipulation/normalizeString";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";

type RouteContext = {
  params: Promise<{ content: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await dbConnect.connect();

    const { content } = await params;
    if (!content) {
      return Response.json({ error: "Missing content param" }, { status: 400 });
    }

    // 1. Blocklist check
    const blockResult = checkMultipleFieldsBlocklist([
      { value: content, fieldName: "content" },
    ]);

    const errorResponse = respondIfBlocked(blockResult);
    if (errorResponse) {
      return errorResponse;
    }

    // 2. Invalid character check
    const invalidChars = regexInvalidInput(content);

    if (invalidChars) {
      return Response.json(
        {
          type: "invalid",
          message: `Ruh Roh! The content ${content} has invalid character(s) ${invalidChars}`,
        },
        { status: 400 },
      );
    }

    const normalizedString = normalizeString(content);

    const existingNameCheck = await Names.findOne({
      normalizedContent: { $regex: new RegExp(`^${normalizedString}$`, "i") },
    })
      .populate({ path: "createdBy", select: "name profileName profileImage" })
      .populate({ path: "tags", select: "tag" });

    // find returns an array
    if (existingNameCheck) {
      return Response.json({
        type: "duplicate",
        data: existingNameCheck,
      });
    }

    return Response.json({
      type: "success",
      message: "Success! That content is not in the database",
    });
  } catch (err) {
    console.error("🔥 Error in GET route:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
