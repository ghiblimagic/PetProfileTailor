import dbConnect from "@utils/db";
import Names from "@models/Name";
import NameTag from "@/models/NameTag";
import User from "@/models/User";
import { checkMultipleFieldsBlocklist } from "@/utils/api/checkMultipleBlocklists";
import normalizeString from "@/utils/stringManipulation/normalizeString";
import { respondIfBlocked } from "@/utils/api/checkMultipleBlocklists";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";

export async function GET(req, { params }) {
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
    } else {
      return Response.json({
        type: "success",
        message: "Success! That content is not in the database",
      });
    }
  } catch (err) {
    console.error("🔥 Error in GET route:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
