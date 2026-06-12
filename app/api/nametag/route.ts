/**
 * Name tags CRUD (GET public, POST admin).
 * Notes: docs/notes/app/api/category-tag-routes.md
 */
import dbConnect from "@utils/db";
import NameTag from "@models/NameTag";
import { checkIfAdmin } from "@/utils/api/checkIfAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect.connect();

  try {
    const nametag = await NameTag.find();
    return NextResponse.json(nametag, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect.connect();

  try {
    const admin = await checkIfAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const nametag = await NameTag.create({
      ...body,
      createdBy: admin.session.user.id,
    });

    return NextResponse.json(nametag, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
