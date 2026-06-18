/**
 * E2E only — set user status for mid-session ban tests and cleanup.
 */
import dbConnect from "@utils/db";
import User from "@models/User";
import { USER_STATUSES, type UserStatus } from "@models/User";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { isE2eServerMode } from "@/utils/api/e2eTestMode";

type SetUserStatusBody = {
  status: UserStatus;
  email?: string;
};

export async function POST(req: Request) {
  if (!isE2eServerMode()) {
    return new Response(null, { status: 404 });
  }

  let body: SetUserStatusBody;
  try {
    body = (await req.json()) as SetUserStatusBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !USER_STATUSES.includes(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  await dbConnect.connect();

  const auth = await getSessionForApis({ req });
  if (auth.ok) {
    const sessionUser = auth.session.user;
    const filter = sessionUser.id
      ? { _id: sessionUser.id }
      : sessionUser.email
        ? { email: sessionUser.email.toLowerCase().trim() }
        : null;

    if (!filter) {
      return Response.json({ error: "Session user not identifiable" }, { status: 400 });
    }

    const updated = await User.findOneAndUpdate(
      filter,
      { status: body.status },
      { new: true },
    );
    if (!updated) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ ok: true, status: updated.status });
  }

  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL?.toLowerCase().trim();
  const email = body.email?.toLowerCase().trim();
  if (!testEmail || !email || email !== testEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const updated = await User.findOneAndUpdate(
    { email: testEmail },
    { status: body.status },
    { new: true },
  );
  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
