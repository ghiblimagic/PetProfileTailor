/**
 * Paginated names listing for SWR. Notes: docs/notes/app/api/names-swr-route.md
 */
import dbConnect from "@utils/db";
import Names from "@models/Name";
import mongoose from "mongoose";
import {
  buildNamesSwrSort,
  mergePostBodyWithSearchParams,
  parseNamesSwrRequest,
  parseSourceFromGet,
  type NamesSwrSource,
} from "@/utils/api/parseNamesSwrRequest";

const LIMIT = 50;

type NamesSwrResponse = {
  data: unknown[];
  totalPagesInDatabase: number;
  currentPage: number;
  totalDocs: number;
};

async function resolveSource(req: Request): Promise<NamesSwrSource> {
  const { searchParams } = new URL(req.url);

  if (req.method === "POST") {
    let body: NamesSwrSource = {};
    try {
      const parsed = await req.json();
      if (parsed && Object.keys(parsed).length > 0) {
        body = parsed as NamesSwrSource; // POST with body
      } else {
        body = {}; // POST with empty body → treat as GET
      }
    } catch {
      // If parsing fails (empty body), treat as GET
      body = {};
    }
    // Merge in query parameters too (so ?page=2 still works; otherwise page stays at 1 because POST body alone won't carry page 2, 3, etc.)
    return mergePostBodyWithSearchParams(body, searchParams);
  }

  return parseSourceFromGet(searchParams);
}

function buildFilter(parsed: ReturnType<typeof parseNamesSwrRequest>) {
  const filter: Record<string, unknown> = {};

  if (parsed.tags?.length) {
    const tagIds = parsed.tags.map((id) => new mongoose.Types.ObjectId(id));
    filter.tags = { $all: tagIds };
  }

  if (parsed.profileUserId) {
    filter.createdBy = new mongoose.Types.ObjectId(parsed.profileUserId);
  }

  if (parsed.likedIds?.length) {
    const likedObjectIds = parsed.likedIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    filter._id = { $in: likedObjectIds };
  }

  return filter;
}

async function handleRequest(req: Request): Promise<Response> {
  await dbConnect.connect();

  const source = await resolveSource(req);
  const parsed = parseNamesSwrRequest(source);
  const sortLogic = buildNamesSwrSort(
    parsed.sortingProperty,
    parsed.sortingValue,
  );
  const filter = buildFilter(parsed);

  try {
    const totalDocs = await Names.countDocuments(filter);
    const totalPagesInDatabase = Math.ceil(totalDocs / LIMIT);

    const names = await Names.aggregate([
      { $match: filter },
      { $sort: sortLogic },
      { $skip: (parsed.page - 1) * LIMIT },
      { $limit: LIMIT },
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
          from: "nametags",
          localField: "tags",
          foreignField: "_id",
          as: "tagsLookup",
        },
      },
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
          tags: { tag: 1, _id: 1 },
          createdBy: {
            name: 1,
            profileName: 1,
            profileImage: 1,
            _id: 1,
          },
          likedByCount: 1,
          updatedAt: 1,
        },
      },
    ]);

    const payload: NamesSwrResponse = {
      data: names,
      totalPagesInDatabase,
      currentPage: parsed.page,
      totalDocs,
    };

    return Response.json(payload);
  } catch (err) {
    console.error("API error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleRequest(req);
}

export async function POST(req: Request) {
  return handleRequest(req);
}

// Tiebreaker notes: docs/notes/app/api/names-swr-route.md
