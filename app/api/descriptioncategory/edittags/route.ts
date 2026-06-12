/**
 * Admin: push a description tag onto multiple description categories.
 * Notes: docs/notes/app/api/category-tag-routes.md
 */
import dbConnect from "@utils/db";
import Category from "@/models/DescriptionCategory";
import { checkIfAdmin } from "@/utils/api/checkIfAdmin";

type EditTagsBody = {
  newtagid?: string;
  categoriesToUpdate?: string[];
};

export async function PUT(req: Request) {
  await dbConnect.connect();

  const admin = await checkIfAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { newtagid, categoriesToUpdate } =
      (await req.json()) as EditTagsBody;

    const category = await Category.updateMany(
      { _id: { $in: categoriesToUpdate } },
      { $push: { tags: newtagid } },
    );

    return Response.json(category, { status: 200 });
  } catch (err) {
    console.error("Error updating categories:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
