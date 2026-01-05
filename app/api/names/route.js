import dbConnect from "@utils/db";
import mongoose from "mongoose";
import NameTag from "@/models/NameTag";
import Names from "@models/Name";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";
import { checkOwnership } from "@/utils/api/checkOwnership";
import { getSessionForApis } from "@/utils/api/getSessionForApis";
import { checkMultipleFieldsBlocklist } from "@/utils/api/checkMultipleBlocklists";
import { respondIfBlocked } from "@/utils/api/checkMultipleBlocklists";
import normalizeString from "@/utils/stringManipulation/normalizeString";
import { findExactNormalized } from "@/utils/stringManipulation/findNormalizedMatch";

export async function GET(req) {
  await dbConnect.connect();

  console.log();

  try {
    const names = await Names.find()
      .populate({
        path: "createdBy",
        select: ["name", "profileName", "profileImage"],
      })
      .populate({ path: "tags", select: ["tag"] });

    return Response.json(names);
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect.connect();

  const { ok, session } = await getSessionForApis({ req });
  if (!ok)
    return Response.json({ message: "Not authenticated" }, { status: 401 });

  const { content, notes, tags } = await req.json();

  if (content.length > 50) {
    return Response.json(
      {
        message: `Ruh Roh! The name ${content} has more than 50 characters. It is ${content.length} characters`,
      },
      { status: 400 },
    );
  }

  try {
    const blockResult = checkMultipleFieldsBlocklist([
      { value: content, fieldName: "content" },
      { value: notes, fieldName: "notes" },
    ]);

    const errorResponse = respondIfBlocked(blockResult);
    if (errorResponse) return errorResponse;

    const existingNameCheck = await findExactNormalized(Names, content);

    const invalidChars = regexInvalidInput(content);

    if (existingNameCheck) {
      return Response.json(
        {
          message: `Ruh Roh! The name ${content} already exists!`,
          existingName: existingNameCheck,
        },
        { status: 409 },
      );
    }

    if (invalidChars) {
      return Response.json(
        {
          message: `Ruh Roh! The name ${content} has invalid character(s) ${invalidChars}`,
        },
        { status: 400 },
      );
    }

    const normalizedString = normalizeString(content);

    const newName = await Names.create({
      content: content.trim(),
      normalizedContent: normalizedString,
      notes,
      tags,
      createdBy: session.user.id,
    });

    return Response.json(newName, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// ######################### PUT ############################################## //

export async function PUT(req) {
  await dbConnect.connect();

  const { submission } = await req.json();
  const { contentId, content, notes, tags } = submission;

  if (content.length > 50) {
    return Response.json(
      {
        message: `Ruh Roh! The name ${content} has more than 50 characters. It is ${content.length} characters`,
      },
      { status: 400 },
    );
  }

  if (content | notes) {
    const blockResult = checkMultipleFieldsBlocklist([
      { value: content, fieldName: "content" },
      { value: notes, fieldName: "notes" },
    ]);

    const errorResponse = respondIfBlocked(blockResult);
    if (errorResponse) return errorResponse;
  }
  const toUpdateName = await Names.findById(contentId);
  if (!toUpdateName)
    return Response.json({ message: "Name not found" }, { status: 404 });

  const { ok } = await checkOwnership({
    req,
    res: null,
    resourceCreatorId: toUpdateName.createdBy,
  });
  if (!ok) return Response.json({ message: "Not authorized" }, { status: 403 });

  try {
    // if the content is changing, make sure it doesn't already exist
    if (
      content &&
      content.toLowerCase() !== toUpdateName.content.toLowerCase()
    ) {
      const existingNameCheck = await findExactNormalized(Names, content);
      if (existingNameCheck) {
        return Response.json(
          { message: `Ruh Roh! The name ${content} already exists!` },
          { status: 409 },
        );
      }
      const normalizedString = normalizeString(content);
      toUpdateName.content = content.trim();
      toUpdateName.normalizedContent = normalizedString;
    }

    if (notes) toUpdateName.notes = notes;
    if (tags) toUpdateName.tags = tags;

    await toUpdateName.save();

    const populatedName = await Names.findById(contentId)
      .populate({ path: "createdBy", select: "name profileName profileImage" })
      .populate({ path: "tags", select: "tag" });

    return Response.json({ data: populatedName, message: "Name Updated" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect.connect();

  try {
    const { contentId } = await req.json();
    const objectId = mongoose.Types.ObjectId(contentId);
    await Names.deleteOne({ _id: objectId });

    return Response.json({ success: true, msg: `Name Deleted ${contentId}` });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}

// // Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// import dbConnect from "@utils/db";
// const mongoose = require("mongoose");
// import Names from "@models/Name";
// import regexInvalidInput from "@utils/stringManipulation/check-for-valid-names";
// // eslint-disable-next-line no-unused-vars
// import tags from "@models/NameTag";
// //necessary or the tags won't populate
// import { checkOwnership } from "@/utils/api/checkOwnership";
// import { getSessionForApis } from "@/utils/api/getSessionForApis";

// export default async function handler(req, res) {
//   const { method } = req;
//   await dbConnect.connect();

//   if (method === "GET") {
//     try {
//       const individualNames = await Names.find()
//         .populate({
//           path: "createdBy",
//           select: ["name", "profileName", "profileImage"],
//         })
//         .populate({ path: "tags", select: ["tag"] });
//       res.status(200).json(individualNames);
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   }

//   if (method === "PUT") {
//     const { notes, content, tags, contentId } = req.body.submission;

//     console.log(
//       "notes in put request",
//       notes,
//       "put request",
//       req.body.submission,
//     );

//     const toUpdateName = await Names.findById(contentId);

//     if (!toUpdateName) {
//       return res.status(404).json({ message: "Name not found" });
//     }
//     const { ok } = await checkOwnership({
//       req,
//       res,
//       resourceCreatorId: toUpdateName.createdBy,
//     });
//     if (!ok) {
//       return;
//     }

//     try {
//       // Only check if user is actually changing the name
//       if (
//         content &&
//         content.toLowerCase() !== (await toUpdateName.content.toLowerCase())
//       ) {
//         const existingNameCheck = await Names.findOne({
//           content: { $regex: new RegExp(`^${content}$`, "i") },
//         });

//         if (existingNameCheck) {
//           return res.status(409).json({
//             message: `Ruh Roh! The name ${content} already exists`,
//           });
//         }
//       }
//       if (notes) {
//         toUpdateName.notes = notes;
//       }
//       if (content) {
//         toUpdateName.content = content;
//       }

//       if (tags) {
//         toUpdateName.tags = tags;
//       }

//       await toUpdateName.save();

//       const populateName = await Names.findById(contentId)
//         .populate({
//           path: "createdBy",
//           select: "name profileName profileImage",
//         })
//         .populate({ path: "tags", select: "tag" });

//       res.send({
//         data: populateName,
//         message: "Name Updated",
//       });
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   }

//   if (method === "POST") {
//     const { ok, session } = await getSessionForApis({
//       req,
//       res,
//     });
//     if (!ok) {
//       return;
//     }

//     const { content, notes, tags, createdBy } = req.body;

//     let existingNameCheck = await Names.find({
//       content: { $regex: new RegExp(`^${content}$`, "i") },
//     });
//     // case-insensitive query
//     // "mike" will get the name already exists error if it matches a "Mike", "MIKE", "mikE", etc.
//     // he ^ and $ anchors make sure it only matches the full string (not substrings).

//     let checkForInvalidInput = regexInvalidInput(content);
//     console.log(checkForInvalidInput);

//     if (existingNameCheck && existingNameCheck.length != 0) {
//       res.status(409).json({
//         message: `Ruh Roh! The name ${content} already exists`,
//         existingName: existingNameCheck,
//       });
//       return;
//     } else if (checkForInvalidInput != null) {
//       res.status(400).json({
//         message: `Ruh Roh! The name ${content} has invalid character(s) ${checkForInvalidInput}`,
//       });
//       return;
//     } else {
//       try {
//         const test = await Names.create({
//           ...req.body,
//           createdBy: session.user.id,
//         });
//         res.status(201).json(test);
//       } catch (err) {
//         res.status(500).json(err);
//       }
//     }
//   }

//   if (method === "DELETE") {
//     try {
//       let idToObjectId = mongoose.Types.ObjectId(req.body.contentId);
//       const test = await Names.deleteOne({ _id: idToObjectId });
//       res.status(200).json({ success: true, msg: `Name Deleted ${test}` });
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   } else {
//     res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
//     res.status(405).end(`Method ${method} Not Allowed`);
//   }
// }
