/**
 * Validate password-reset token before showing reset form.
 * Notes: docs/notes/app/api/verifyresetpasstoken-route.md
 */
import User from "@models/User";
import db from "@utils/db";
import crypto from "crypto";
import { NextResponse } from "next/server";

type VerifyResetBody = {
  token?: string;
};

export async function POST(req: Request) {
  const { token } = (await req.json()) as VerifyResetBody;

  if (!token) {
    return NextResponse.json(
      { message: "Invalid token or token has expired" },
      { status: 404 },
    );
  }

  await db.connect();

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Invalid token or token has expired" },
      { status: 404 },
    );
  }

  return NextResponse.json(user, { status: 200 });
}
