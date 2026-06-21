/**
 * E2E only — remove thank rows for a content item so UI/API tests can submit again.
 */
import dbConnect from "@utils/db";
import Thanks from "@/models/Thank";
import { isE2eServerMode } from "@/utils/api/e2eTestMode";
import { checkIfValidContentType } from "@/utils/api/checkIfValidContentType";

type ResetThanksBody = {
  contentType?: string;
  contentId?: string;
};

export async function POST(req: Request) {
  if (!isE2eServerMode()) {
    return new Response(null, { status: 404 });
  }

  let body: ResetThanksBody = {};
  try {
    body = (await req.json()) as ResetThanksBody;
  } catch {
    // optional body
  }

  const { contentType, contentId } = body;
  if (!contentType || !contentId) {
    return Response.json(
      { error: "contentType and contentId required" },
      { status: 400 },
    );
  }

  checkIfValidContentType(contentType);

  await dbConnect.connect();

  const filter =
    contentType === "names"
      ? { nameId: contentId }
      : { descriptionId: contentId };

  const result = await Thanks.deleteMany(filter);

  return Response.json({ deletedCount: result.deletedCount });
}
