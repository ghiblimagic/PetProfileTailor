// app/api/description/swr/route.js
import dbConnect from "@utils/db";
import Description from "@/models/Description";
import mongoose from "mongoose";

const LIMIT = 50;

async function buildSourceFromSearchParams(searchParams) {
  // Build the same shape as the old req.query would have produced
  const tags = searchParams.getAll("tags") || [];

  // for if we're only returning items the user liked, for the dashboard SWR
  let likedIds = searchParams.getAll("likedIds") || [];
  // Case 1: Already an array of string
  // ["abc", "def"].

  // Case 2: support comma-separated fallback like ?likedIds=1,2,3
  // ["abc,def"] (a single string)
  // Normalizes it into the same shape as Case 1
  if (!likedIds.length) {
    const likedCsv = searchParams.get("likedIds");
    if (likedCsv)
      likedIds = likedCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  }
  // Filter by user ID if provided
  const profileUserId = searchParams.get("profileUserId") || undefined;

  const source = {};
  if (tags.length) source.tags = tags;
  if (profileUserId) source.profileUserId = profileUserId;
  if (likedIds.length) source.likedIds = likedIds;

  return source;
}

async function runAggregation({ req, source }) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const sortingvalue = parseInt(searchParams.get("sortingvalue") || "-1", 10);
  const sortingProperty = searchParams.get("sortingproperty") || "likedByCount";

  const limit = LIMIT;
  const sortLogic = {};
  sortLogic[sortingProperty] = sortingvalue;

  // If no source provided (POST with empty body or GET), build it from search params
  if (!source || Object.keys(source).length === 0) {
    source = await buildSourceFromSearchParams(searchParams);
  }

  const { tags, profileUserId, likedIds } = source || {};

  // Build filter
  const filter = {};
  if (tags?.length) {
    const tagIds = tags.map((id) => new mongoose.Types.ObjectId(id));
    filter.tags = { $all: tagIds };
  }

  if (profileUserId) {
    // Ensure it’s a valid ObjectId
    filter.createdBy = new mongoose.Types.ObjectId(profileUserId);
  }

  if (likedIds?.length) {
    const likedObjectIds = likedIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    filter._id = { $in: likedObjectIds };
  }

  const totalDocs = await Description.countDocuments(filter);
  const totalPagesInDatabase = Math.ceil(totalDocs / parseInt(limit, 10));

  const descriptions = await Description.aggregate([
    { $match: filter },

    // Pagination + sort
    {
      $sort:
        sortingProperty === "_id"
          ? sortLogic // If sorting by _id, don't add tiebreaker
          : { ...sortLogic, _id: 1 }, // Otherwise, add _id as tiebreaker
    }, // _id in ascending order  *** notes below for tiebreaker
    { $skip: (page - 1) * parseInt(limit, 10) },
    { $limit: parseInt(limit, 10) },

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
    currentPage: page,
    totalDocs,
  };
}

/* GET handler - reads filters from querystring */
export async function GET(req) {
  try {
    await dbConnect.connect();

    // For GET, we treat everything as coming from the URL search params
    const result = await runAggregation({ req, source: null });
    return Response.json({
      data: result.descriptions,
      totalPagesInDatabase: result.totalPagesInDatabase,
      currentPage: result.currentPage,
      totalDocs: result.totalDocs,
    });
  } catch (err) {
    console.error("API error (GET):", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

/* POST handler - if body present, use body for filters; otherwise fall back to querystring */
export async function POST(req) {
  try {
    await dbConnect.connect();

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // empty body or invalid JSON -> treat as empty
      body = {};
    }

    const source = body && Object.keys(body).length > 0 ? body : null;
    const result = await runAggregation({ req, source });

    return Response.json({
      data: result.descriptions,
      totalPagesInDatabase: result.totalPagesInDatabase,
      currentPage: result.currentPage,
      totalDocs: result.totalDocs,
    });
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
