/**
 * Send password-reset email via Resend.
 * Notes: docs/notes/app/api/forgotpassword-route.md
 */
import User from "@models/User";
import db from "@utils/db";
import crypto from "crypto";
import { Resend } from "resend";
import { ResetPasswordEmail } from "@components/EmailTemplates/reset-password-template";

const resend = new Resend(process.env.RESEND_API_KEY);

type ForgotPasswordBody = {
  email?: string;
};

export async function POST(req: Request) {
  const { email } = (await req.json()) as ForgotPasswordBody;

  if (!email) {
    return Response.json({ message: "Email does not exist" }, { status: 404 });
  }

  await db.connect();

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    return Response.json({ message: "Email does not exist" }, { status: 404 });
  }

  const emailResetPasswordToken = crypto.randomBytes(20).toString("hex");
  const databaseResetPasswordToken = crypto
    .createHash("sha256")
    .update(emailResetPasswordToken)
    .digest("hex");

  const passwordResetExpires = Date.now() + 3600000;

  existingUser.passwordResetToken = databaseResetPasswordToken;
  existingUser.resetTokenExpires = new Date(passwordResetExpires);

  const resetUrl = `${process.env.NEXTAUTH_URL}/resetpassword/${emailResetPasswordToken}`;
  const userName = existingUser.profileName;

  try {
    await existingUser.save();

    await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM ?? "",
      to: email,
      subject: "Reset Password",
      react: ResetPasswordEmail({
        userFirstname: userName,
        resetPasswordLink: resetUrl,
      }),
    });

    return Response.json(
      { message: "Password reset email was sent" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
