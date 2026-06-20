/**
 * Validate password-reset token before showing reset form.
 * Notes: docs/notes/app/api/verifyresetpasstoken-route.md
 */
import User from "@models/User";
import db from "@utils/db";
import { NextResponse } from "next/server";
import {
  buildVerifyResetTokenFilter,
} from "@/utils/api/authPasswordResetUpdate";
import { hashPasswordResetToken } from "@/utils/api/passwordResetToken";

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

  const hashedToken = hashPasswordResetToken(token);

  const user = await User.findOne(buildVerifyResetTokenFilter(hashedToken));

  if (!user) {
    return NextResponse.json(
      { message: "Invalid token or token has expired" },
      { status: 404 },
    );
  }

  return NextResponse.json(user, { status: 200 });
}
