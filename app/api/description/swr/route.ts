/**
 * Paginated descriptions listing for SWR. Notes: docs/notes/app/api/description-swr-route.md
 */
import dbConnect from "@utils/db";
import Description from "@/models/Description";
import mongoose from "mongoose";
import {
  buildNamesSwrSort,
  buildSwrFilterSourceFromSearchParams,
  parseSwrFilters,
  parseSwrPaginationFromSearchParams,
  type NamesSwrSource,
} from "@/utils/api/parseNamesSwrRequest";

const LIMIT = 50;

type DescriptionSwrResponse = {
  data: unknown[];
  totalPagesInDatabase: number;
  currentPage: number;
  totalDocs: number;
};

async function resolveFilterSource(
  req: Request,
  searchParams: URLSearchParams,
): Promise<NamesSwrSource> {
  if (req.method === "GET") {
    return buildSwrFilterSourceFromSearchParams(searchParams);
  }

  let body: NamesSwrSource = {};
  try {
    const parsed = await req.json();
    if (parsed && Object.keys(parsed).length > 0) {
      body = parsed as NamesSwrSource; // POST with body
    } else {
      body = {}; // POST with empty body → fall back to query filters
    }
  } catch {
    // empty body or invalid JSON -> treat as empty
    body = {};
  }

  if (Object.keys(body).length > 0) {
    return body;
  }

  // If no source provided (POST with empty body or GET), build it from search params
  return buildSwrFilterSourceFromSearchParams(searchParams);
}

function buildFilter(
  filters: ReturnType<typeof parseSwrFilters>,
): Record<string, unknown> {
  // Build filter
  const filter: Record<string, unknown> = {};

  if (filters.tags?.length) {
    const tagIds = filters.tags.map((id) => new mongoose.Types.ObjectId(id));
    filter.tags = { $all: tagIds };
  }

  if (filters.profileUserId) {
    // Ensure it's a valid ObjectId
    filter.createdBy = new mongoose.Types.ObjectId(filters.profileUserId);
  }

  if (filters.likedIds?.length) {
    const likedObjectIds = filters.likedIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    filter._id = { $in: likedObjectIds };
  }

  return filter;
}

async function runAggregation(req: Request) {
  const { searchParams } = new URL(req.url);
  const pagination = parseSwrPaginationFromSearchParams(searchParams);
  const filterSource = await resolveFilterSource(req, searchParams);
  const filters = parseSwrFilters(filterSource);
  const sortLogic = buildNamesSwrSort(
    pagination.sortingProperty,
    pagination.sortingValue,
  );
  const filter = buildFilter(filters);

  const totalDocs = await Description.countDocuments(filter);
  const totalPagesInDatabase = Math.ceil(totalDocs / LIMIT);

  const descriptions = await Description.aggregate([
    { $match: filter },

    // Pagination + sort
    { $sort: sortLogic }, // _id in ascending order — see docs for tiebreaker notes
    { $skip: (pagination.page - 1) * LIMIT },
    { $limit: LIMIT },

    // Lookups
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },
    { $unwind: "$createdBy" },
    {
      $lookup: {
        from: "descriptiontags",
        localField: "tags",
        foreignField: "_id",
        as: "tagsLookup",
      },
    },

    // Preserve original tag order by mapping original tag ids to their full docs
    {
      $addFields: {
        tags: {
          $map: {
            input: "$tags",
            as: "tagId",
            in: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$tagsLookup",
                    as: "t",
                    cond: { $eq: ["$$t._id", "$$tagId"] },
                  },
                },
                0,
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        notes: 1,
        tags: 1,
        createdBy: 1,
        likedByCount: 1,
        updatedAt: 1,
      },
    },

    // Final projection (keep shape identical to original)
    {
      $project: {
        content: 1,
        notes: 1,
        tags: { tag: 1, _id: 1 },
        createdBy: {
          _id: 1,
          name: 1,
          profileName: 1,
          profileImage: 1,
        },
        likedByCount: 1,
        updatedAt: 1,
      },
    },
  ]);

  return {
    descriptions,
    totalPagesInDatabase,
    currentPage: pagination.page,
    totalDocs,
  };
}

function jsonResponse(result: Awaited<ReturnType<typeof runAggregation>>) {
  const payload: DescriptionSwrResponse = {
    data: result.descriptions,
    totalPagesInDatabase: result.totalPagesInDatabase,
    currentPage: result.currentPage,
    totalDocs: result.totalDocs,
  };
  return Response.json(payload);
}

/* GET handler - reads filters from querystring */
export async function GET(req: Request) {
  try {
    await dbConnect.connect();

    // For GET, we treat everything as coming from the URL search params
    const result = await runAggregation(req);
    return jsonResponse(result);
  } catch (err) {
    console.error("API error (GET):", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

/* POST handler - if body present, use body for filters; otherwise fall back to querystring */
export async function POST(req: Request) {
  try {
    await dbConnect.connect();

    const result = await runAggregation(req);
    return jsonResponse(result);
  } catch (err) {
    console.error("API error (POST):", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

/* Explicitly disallow PUT / DELETE (mirrors your original behavior) */
export function PUT() {
  return new Response("Method Not Allowed", { status: 405 });
}

export function DELETE() {
  return new Response("Method Not Allowed", { status: 405 });
}

// Tiebreaker notes: docs/notes/app/api/description-swr-route.md
