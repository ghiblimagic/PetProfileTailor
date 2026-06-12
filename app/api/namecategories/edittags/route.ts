/**
 * Admin: push a name tag onto multiple name categories.
 * Notes: docs/notes/app/api/category-tag-routes.md
 */
import dbConnect from "@utils/db";
import Category from "@models/NameCategory";
import { checkIfAdmin } from "@/utils/api/checkIfAdmin";
import { NextResponse } from "next/server";

type EditTagsBody = {
  newtagid?: string;
  categoriesToUpdate?: string[];
};

export async function PUT(req: Request) {
  await dbConnect.connect();

  try {
    const admin = await checkIfAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { newtagid, categoriesToUpdate } =
      (await req.json()) as EditTagsBody;

    const category = await Category.updateMany(
      { _id: { $in: categoriesToUpdate } },
      { $push: { tags: newtagid } },
    );

    return NextResponse.json(category, { status: 200 });
  } catch (err) {
    console.error("Error updating categories:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
