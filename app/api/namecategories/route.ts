/**
 * Name categories CRUD (GET public, POST admin).
 * Notes: docs/notes/app/api/category-tag-routes.md
 */
import dbConnect from "@utils/db";
import Category from "@models/NameCategory";
import { checkIfAdmin } from "@/utils/api/checkIfAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect.connect();

  try {
    const category = await Category.find().populate("tags");
    return NextResponse.json(category, { status: 200 });
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect.connect();

  const admin = await checkIfAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const newCategory = await req.json();

    const category = await Category.create({
      ...newCategory,
      createdBy: admin.session.user.id,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("Error creating category:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
