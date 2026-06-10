/**
 * Live duplicate check while adding a description (start-normalized match).
 * Notes: docs/notes/app/api/check-if-content-exists.md
 */
import dbConnect from "@utils/db";
import Description from "@/models/Description";
import {
  checkMultipleFieldsBlocklist,
  respondIfBlocked,
} from "@/utils/api/checkMultipleBlocklists";
import { findStartNormalized } from "@/utils/stringManipulation/findNormalizedMatch";

type RouteContext = {
  params: Promise<{ content: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  await dbConnect.connect();

  const { content } = await params;

  // 1. Blocklist check
  const blockResult = checkMultipleFieldsBlocklist([
    { value: content, fieldName: "content" },
  ]);

  const errorResponse = respondIfBlocked(blockResult);
  if (errorResponse) return errorResponse;

  // // 2. Invalid character check
  // const invalidChars = regexInvalidInput(content);

  // if (invalidChars) {
  //   return Response.json(
  //     {
  //       type: "invalid",
  //       message: `Ruh Roh! The content ${content} has invalid character(s) ${invalidChars}`,
  //     },
  //     { status: 400 },
  //   );
  // }

  try {
    const existingContentCheck = await findStartNormalized(
      Description,
      content,
    );

    // findOne returns an object
    if (existingContentCheck) {
      return Response.json({
        type: "duplicate",
        data: existingContentCheck,
      });
    }

    return Response.json({
      type: "success",
      message: "Success! That content is not in the database",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
