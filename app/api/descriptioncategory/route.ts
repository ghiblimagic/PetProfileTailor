/**
 * Description categories CRUD (GET public, POST admin).
 * Notes: docs/notes/app/api/category-tag-routes.md
 */
import dbConnect from "@utils/db";
import Category from "@/models/DescriptionCategory";
import { checkIfAdmin } from "@/utils/api/checkIfAdmin";

export async function GET() {
  await dbConnect.connect();

  try {
    const category = await Category.find().populate("tags");
    return Response.json(category, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect.connect();

  try {
    const admin = await checkIfAdmin();
    if (!admin.ok) return admin.response;

    const body = await req.json();

    const newDescriptionCategory = await Category.create({
      ...body,
      createdBy: admin.session.user.id,
    });

    return Response.json(newDescriptionCategory, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
