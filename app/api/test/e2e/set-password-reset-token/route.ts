/**
 * E2E only — set a password-reset token without sending email.
 */
import crypto from "crypto";
import dbConnect from "@utils/db";
import User from "@models/User";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { isE2eServerMode } from "@/utils/api/e2eTestMode";

type SetPasswordResetTokenBody = {
  email?: string;
};

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

    const emailResetPasswordToken = crypto.randomBytes(20).toString("hex");
    const databaseResetPasswordToken = crypto
      .createHash("sha256")
      .update(emailResetPasswordToken)
      .digest("hex");

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: databaseResetPasswordToken,
        resetTokenExpires: new Date(Date.now() + 3600000),
      },
      { new: true },
    );

    if (!updated) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ token: emailResetPasswordToken });
  }

  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL?.toLowerCase().trim();
  const requested = body.email?.toLowerCase().trim();
  if (!testEmail || !requested || requested !== testEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const emailResetPasswordToken = crypto.randomBytes(20).toString("hex");
  const databaseResetPasswordToken = crypto
    .createHash("sha256")
    .update(emailResetPasswordToken)
    .digest("hex");

  const updated = await User.findOneAndUpdate(
    { email: testEmail },
    {
      passwordResetToken: databaseResetPasswordToken,
      resetTokenExpires: new Date(Date.now() + 3600000),
    },
    { new: true },
  );

  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ token: emailResetPasswordToken });
}
