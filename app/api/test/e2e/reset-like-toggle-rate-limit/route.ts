/**
 * E2E only — clear in-memory like-toggle rate limit for the signed-in user.
 */
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { isE2eServerMode } from "@/utils/api/e2eTestMode";
import { resetLikeToggleRateLimit } from "@/utils/api/likeToggleRateLimit";

export async function POST(req: Request) {
  if (!isE2eServerMode()) {
    return new Response(null, { status: 404 });
  }

  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = auth.session.user.id;
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  resetLikeToggleRateLimit(userId);
  return Response.json({ ok: true });
}
