/**
 * E2E only — set a password-reset token without sending email.
 */
import dbConnect from "@utils/db";
import User from "@models/User";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { isE2eServerMode } from "@/utils/api/e2eTestMode";
import { createPasswordResetToken } from "@/utils/api/passwordResetToken";

type SetPasswordResetTokenBody = {
  email?: string;
};

function passwordResetUpdateFields() {
  const { plainToken, hashedToken, expiresAt } = createPasswordResetToken();
  return {
    plainToken,
    update: {
      passwordResetToken: hashedToken,
      resetTokenExpires: expiresAt,
    },
  };
}

export async function POST(req: Request) {
  if (!isE2eServerMode()) {
    return new Response(null, { status: 404 });
  }

  let body: SetPasswordResetTokenBody = {};
  try {
    body = (await req.json()) as SetPasswordResetTokenBody;
  } catch {
    // optional body
  }

  await dbConnect.connect();

  const auth = await getSessionForApis({ req });

  if (auth.ok) {
    const userId = auth.session.user.id;
    if (!userId) {
      return Response.json({ error: "Session user id required" }, { status: 400 });
    }

    const { plainToken, update } = passwordResetUpdateFields();

    const updated = await User.findByIdAndUpdate(userId, update, { new: true });

    if (!updated) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ token: plainToken });
  }

  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL?.toLowerCase().trim();
  const requested = body.email?.toLowerCase().trim();
  if (!testEmail || !requested || requested !== testEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { plainToken, update } = passwordResetUpdateFields();

  const updated = await User.findOneAndUpdate({ email: testEmail }, update, {
    new: true,
  });

  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ token: plainToken });
}
