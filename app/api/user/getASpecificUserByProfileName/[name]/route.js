import { getUserByProfileName } from "@utils/getUserByProfileName";
import User from "@/models/User";
import dbConnect from "@utils/db";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import { getUserFollowers } from "@/utils/api/getUserFollowers";

export async function GET(req, { params }) {
  await dbConnect.connect();

  const { name } = await params;

  try {
    const user = await getUserByProfileName(name);

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const detailedUser = await leanWithStrings(
      User.findById(user.id).select(
        "name profileImage profileName bio location",
      ),
    );
    const followers = await getUserFollowers(user.id);

    return new Response(JSON.stringify({ ...detailedUser, followers }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// // Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// import { getUserByProfileName } from "@utils/getUserByProfileName";
// import User from "@/models/User";

// export default async function handler(req, res) {
//   const { name: profilename } = req.query;

//   if (req.method !== "GET") return res.status(405).end();

//   try {
//     const user = await getUserByProfileName(profilename);

//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Apply select/populate only in this API route
//     const detailedUser = await User.findById(user.id).select(
//       "name followers profileImage profileName bio location",
//     );

//     res.status(200).json(detailedUser);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }
