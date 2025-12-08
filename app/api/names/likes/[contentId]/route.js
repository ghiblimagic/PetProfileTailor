import Names from "@models/Name";
import db from "@utils/db";
import mongoose from "mongoose";
import { checkOwnership } from "@/utils/api/checkOwnership";

export async function GET(req, { params }) {
  await db.connect();

  const { id } = await params;

  // console.log("GET individual name id:", id);

  try {
    const individualName = await Names.findOne({ _id: id });

    if (!individualName) {
      return Response.json({ message: "Name not found" }, { status: 404 });
    }

    return Response.json(individualName);
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  await db.connect();

  try {
    const { name, description, tags, id } = await req.json(); // id of document to update

    const individualName = await Names.findById(id);

    if (!individualName) {
      return Response.json({ message: "Name not found" }, { status: 404 });
    }

    const { ok } = await checkOwnership({
      req,
      res: null, // App Router doesn’t use res directly
      resourceCreatorId: individualName.createdBy,
    });

    if (!ok) {
      return Response.json({ message: "Not authorized" }, { status: 403 });
    }

    // convert incoming tags to ObjectIds
    const tagsAsObjectIds = (tags || []).map((t) =>
      t instanceof mongoose.Types.ObjectId ? t : mongoose.Types.ObjectId(t),
    );

    // update fields
    individualName.content = name;
    individualName.notes = description;

    // create a Set of existing tag strings for quick lookup
    const existingTagStrings = new Set(
      individualName.tags.map((t) => t.toString()),
    );
    // filter out any new tags that already exist
    const newTagsToAdd = tagsAsObjectIds.filter(
      (t) => !existingTagStrings.has(t.toString()),
    );
    // append new tags in order
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

// import Names from "@models/Name";
// import db from "@utils/db";
// import { checkOwnership } from "@/utils/api/checkOwnership";

// const handler = async (req, res) => {
//   if (req.method === "GET") {
//     return getHandler(req, res);
//   } else if (req.method === "PUT") {
//     return putHandler(req, res);
//   } else {
//     return res.status(400).send({ message: "Method not allowed" });
//   }
// };
// const getHandler = async (req, res) => {
//   await db.connect();
//   console.log("req.query", req.query);
//   const individualname = await Names.findOne({ id: req.query._id });

//   return res.status(200).json(individualname);
// };

// //

// // I also had the same problem. It was simply solved by using findOne method instead of findById method of mongoose.
// // https://stackoverflow.com/questions/52147649/mongoose-findbyid-return-null
// const putHandler = async (req, res) => {
//   await db.connect();

//   const { name, description, tags } = req.body; // tags = array of ObjectIds or strings

//   // convert incoming tags to ObjectIds
//   const tagsAsObjectIds = (tags || []).map((t) =>
//     t instanceof mongoose.Types.ObjectId ? t : mongoose.Types.ObjectId(t),
//   );

//   const individualname = await Names.findById(req.query.id);

//   if (!individualname)
//     return res.status(404).send({ message: "Name not found" });

//   const { ok } = await checkOwnership({
//     req,
//     res,
//     resourceCreatorId: individualname.createdBy,
//   });
//   if (!ok) {
//     return;
//   }

//   try {
//     // update other fields
//     individualname.content = name;
//     individualname.notes = description;

//     // create a Set of existing tag strings for quick lookup
//     const existingTagStrings = new Set(
//       individualname.tags.map((t) => t.toString()),
//     );

//     // filter out any new tags that already exist
//     const newTagsToAdd = tagsAsObjectIds.filter(
//       (t) => !existingTagStrings.has(t.toString()),
//     );

//     // append new tags in order
//     individualname.tags.push(...newTagsToAdd);

//     await individualname.save();

//     res.send({ message: "Name updated successfully", data: individualname });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ message: "Internal server error" });
//   }
// };

// export default handler;
