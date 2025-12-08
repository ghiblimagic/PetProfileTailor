import dbConnect from "@utils/db.js";
import Names from "@models/Name.js";
import mongoose from "mongoose";

export async function GET(req) {
  return handleRequest(req);
}

export async function POST(req) {
  return handleRequest(req);
}

async function handleRequest(req) {
  await dbConnect.connect();

  const limit = 50;
  const method = req.method;

  let source = {};

  if (method === "POST") {
    try {
      const body = await req.json();
      if (body && Object.keys(body).length > 0) {
        source = body; // POST with body
      } else {
        source = {}; // POST with empty body → treat as GET
      }
    } catch (err) {
      // If parsing fails (empty body), treat as GET
      source = {};
    }
    //  Merge in query parameters too (so ?page=2 still works, otherwise you'll get page 1 over and over again because it won't see the page 2, 3, ect from the params)
    const { searchParams } = new URL(req.url);
    searchParams.forEach((value, key) => {
      if (!source[key]) source[key] = value;
    });
  } else if (method === "GET") {
    const { searchParams } = new URL(req.url);
    searchParams.forEach((value, key) => {
      if (source[key]) {
        if (Array.isArray(source[key])) {
          source[key].push(value);
        } else {
          source[key] = [source[key], value];
        }
      } else {
        source[key] = value;
      }
    });

    // Handle likedIds: support repeated params & CSV
    // Case 1: Already an array of string
    // ["abc", "def"].
    let likedIds = source.likedIds || [];

    if (!Array.isArray(likedIds)) likedIds = [likedIds];

    if (!likedIds.length) {
      // Case 2: support comma-separated fallback like ?likedIds=1,2,3
      // ["abc,def"] (a single string)
      // Normalizes it into the same shape as Case 1
      const likedCsv = searchParams.get("likedIds");

      if (likedCsv) {
        likedIds = likedCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    source.likedIds = likedIds;
  }

  const page = parseInt(source.page) || 1;
  const sortingValue = parseInt(source.sortingvalue) || -1;
  const sortingProperty = source.sortingproperty || "likedByCount";
  const tags = source.tags;
  const profileUserId = source.profileUserId;
  const likedIds = source.likedIds;

  let sortLogic = {};
  sortLogic[sortingProperty] = sortingValue;

  let filter = {};

  if (tags?.length) {
    // console.log("tags in swr", tags);
    const tagIds = tags.map((id) => new mongoose.Types.ObjectId(id));
    filter.tags = { $all: tagIds };
    // console.log("tag ids in swr", tagIds);
  }

  if (profileUserId) {
    filter.createdBy = new mongoose.Types.ObjectId(profileUserId);
  }

  if (likedIds?.length) {
    const likedObjectIds = likedIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    filter._id = { $in: likedObjectIds };
  }

  try {
    const totalDocs = await Names.countDocuments(filter);
    const totalPagesInDatabase = Math.ceil(totalDocs / limit);
    // console.log("filter in swr", filter);

    // console.log(
    //   "sortLogic",
    //   sortLogic,
    //   "page",
    //   page,
    //   "skip",
    //   (page - 1) * limit,
    // );

    const names = await Names.aggregate([
      { $match: filter },
      {
        $sort:
          sortingProperty === "_id"
            ? sortLogic // If sorting by _id, don't add tiebreaker
            : { ...sortLogic, _id: 1 }, // Otherwise, add _id as tiebreaker
      }, // _id in ascending order  *** notes below for tiebreaker
      { $skip: (page - 1) * limit },
      { $limit: limit },

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

    return Response.json({
      data: names,
      totalPagesInDatabase,
      currentPage: page,
      totalDocs,
    });
  } catch (err) {
    console.error("API error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

//################ NOTES FOR TIEBREAKER LOGIC ###########################

// each time the swr request is made, when items both have likedByCount = 0, the sort can return the items in different orders
// by adding _id, its telling them to sort the items by _id too. This avoids duplicates entirely because it ensures the items on page 2, page 3 aren't sorted in a different order when they have the same likedByCount number.

// The Problem Without a Tiebreaker

// The key insight: Without a unique field in your sort, documents with the same sortLogic value (like the same likedByCount) can be returned in non-deterministic order across different pages, causing duplicates or missing items.

// Let's say you have 3 documents with the same likedByCount:

// { _id: "abc", content: "Name A", likedByCount: 5 }
// { _id: "def", content: "Name B", likedByCount: 5 }
// { _id: "xyz", content: "Name C", likedByCount: 5 }

// With only { likedByCount: -1 }, MongoDB doesn't guarantee which order these 3 documents will be returned in. On page 1 you might get ABC, but on page 2 (after skip), you might get documents in a different order like BAC, causing "Name B" to appear on both pages.

// why I saw only 2 items duplicate out of the 185

// Items that don't duplicate:

// ✅ Items with unique sort values (only one item has likedByCount = 7)
// ✅ Items within the same page boundary (items 5-10 all on page 1)
// ✅ Items where the "tie group" doesn't cross a page boundary

// Items that can duplicate:

// ❌ Multiple items with the same sort value that happen to fall right at a page boundary (like positions 48-52 when limit is 50)

// The 50 vs 200 Item Mystery
// You mentioned there were no duplicates at limit 200. This makes perfect sense!
// With limit 50:

// More page boundaries = more chances for "tie groups" to be split across pages
// Your duplicates were probably around items 48-52 or 98-102

// With limit 200:

// Fewer page boundaries = less chance a "tie group" gets split
// The items that would duplicate at 50 per page are now safely within a single page

// The Real Pattern
// You likely have several items with likedByCount: 0 (or whatever your sort property is), and only the ones that were unlucky enough to be positioned right at a 50-item boundary got duplicated. The other 183 items either had unique values or weren't near boundaries.
// That's why adding _id as a tiebreaker fixes it universally - even items with identical sort values now have a consistent, deterministic order regardless of where the page boundary falls!
