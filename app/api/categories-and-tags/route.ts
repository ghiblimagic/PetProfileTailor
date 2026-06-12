/**
 * Categories + populated tags for names and descriptions.
 * Notes: docs/notes/app/api/categories-and-tags-route.md
 */
import { NextResponse } from "next/server";
import dbConnect from "@utils/db";
import NameCategory from "@/models/NameCategory";
import DescriptionCategory from "@/models/DescriptionCategory";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import type { CategoryWithTags } from "@/context/CategoriesAndTagsContext";

// Control revalidation (cache TTL in seconds)
export const revalidate = 10800; // cache for 3 hours

export type CategoriesAndTagsResponse = {
  names: CategoryWithTags[];
  descriptions: CategoryWithTags[];
};

export async function GET() {
  try {
    await dbConnect.connect(); // make sure db.connect uses a global connection

    const [nameCategories, descCategories] = await Promise.all([
      leanWithStrings(NameCategory.find().populate("tags").sort({ order: 1 })),
      leanWithStrings(
        DescriptionCategory.find().populate("tags").sort({ order: 1 }),
      ),
    ]);

    const body: CategoriesAndTagsResponse = {
      names: nameCategories as unknown as CategoryWithTags[],
      descriptions: descCategories as unknown as CategoryWithTags[],
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
