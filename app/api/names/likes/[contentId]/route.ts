/**
 * Fetch or update a single name by id (legacy path under likes/).
 * Notes: docs/notes/app/api/name-likes-content-route.md
 */
import Names from "@models/Name";
import db from "@utils/db";
import mongoose from "mongoose";
import { checkOwnership } from "@/utils/api/checkOwnership";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

type UpdateNameBody = {
  name?: string;
  description?: string;
  tags?: string[];
  id?: string;
};

export async function GET(_req: Request, { params }: RouteContext) {
  await db.connect();

  const { contentId } = await params;

  try {
    const individualName = await Names.findOne({ _id: contentId });

    if (!individualName) {
      return Response.json({ message: "Name not found" }, { status: 404 });
    }

    return Response.json(individualName);
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  await db.connect();

  try {
    const { name, description, tags, id } =
      (await req.json()) as UpdateNameBody;

    const individualName = await Names.findById(id);

    if (!individualName) {
      return Response.json({ message: "Name not found" }, { status: 404 });
    }

    const ownership = await checkOwnership({
      resourceCreatorId: individualName.createdBy,
    });

    if (!ownership.ok) {
      return Response.json({ message: "Not authorized" }, { status: 403 });
    }

    const tagsAsObjectIds = (tags || []).map(
      (t) => new mongoose.Types.ObjectId(t),
    );

    if (name !== undefined) individualName.content = name;
    if (description !== undefined) individualName.notes = description;

    const existingTagStrings = new Set(
      individualName.tags.map((t) => t.toString()),
    );
    const newTagsToAdd = tagsAsObjectIds.filter(
      (t) => !existingTagStrings.has(t.toString()),
    );
    individualName.tags.push(...newTagsToAdd);

    await individualName.save();

    return Response.json({
      message: "Name updated successfully",
      data: individualName,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
