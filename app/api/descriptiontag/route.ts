/**
 * Description tags CRUD (GET public, POST admin).
 * Notes: docs/notes/app/api/category-tag-routes.md
 */
import dbConnect from "@utils/db";
import DescriptionTag from "@/models/DescriptionTag";
import { checkIfAdmin } from "@/utils/api/checkIfAdmin";

export async function GET() {
  await dbConnect.connect();

  try {
    const descriptionTags = await DescriptionTag.find();
    return Response.json(descriptionTags, { status: 200 });
  } catch (err) {
    console.error("Error fetching description tags:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect.connect();

  const admin = await checkIfAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await req.json();

    const descriptionTag = await DescriptionTag.create({
      ...body,
      createdBy: admin.session.user.id,
    });

    return Response.json(descriptionTag, { status: 201 });
  } catch (err) {
    console.error("Error creating description tag:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
