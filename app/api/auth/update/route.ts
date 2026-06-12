/**
 * Update signed-in user name, email, optional password.
 * Notes: docs/notes/app/api/auth-update-route.md
 */
import bcryptjs from "bcryptjs";
import User from "@models/User";
import db from "@utils/db";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { NextResponse } from "next/server";

type AuthUpdateBody = {
  name?: string;
  email?: string;
  password?: string;
  userid?: string;
};

export async function PUT(req: Request) {
  const body = (await req.json()) as AuthUpdateBody;
  const { name, email, password } = body;

  if (!name || !email || !email.includes("@")) {
    return NextResponse.json({ message: "Validation error" }, { status: 422 });
  }

  const auth = await getSessionForApis({ req });
  if (!auth.ok) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  await db.connect();

  const userId = auth.session.user.id;
  const toUpdateUser = await User.findById(userId);

  if (!toUpdateUser) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  toUpdateUser.name = name;
  toUpdateUser.email = email;

  if (password) {
    toUpdateUser.password = bcryptjs.hashSync(password);
  }

  await toUpdateUser.save();

  return NextResponse.json({ message: "User updated" });
}
