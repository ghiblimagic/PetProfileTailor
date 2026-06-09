import dbConnect from "@utils/db";
import NameLikes from "@/models/NameLike";
import Names from "@models/Name";
import NameTag from "@models/NameTag";
import Descriptions from "@/models/Description";
import DescriptionTag from "@/models/DescriptionTag";
import User from "@models/User";
import { getUserFollowers } from "@/utils/api/getUserFollowers";
import Profile from "@/components/profile";
import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";
import { leanWithStrings } from "@/utils/mongoDataCleanup";

// const ObjectId = require("mongodb").ObjectId;

export default async function ProfilePage({ params }) {
  const session = await getServerSession(serverAuthOptions);
  const { profilename } = await params;

  // console.log("profileName", profilename);
  const usersProfileName = profilename.toLowerCase();

  await dbConnect.connect();

  // ############# FIND A  USER ##################
  const userData = await leanWithStrings(
    User.findOne({ profileName: usersProfileName }).select(
      "name profileImage profileName bio location",
    ),
  );

  if (!userData) {
    return <div>User not found</div>;
  }

  userData.followers = await getUserFollowers(userData._id);
  const userId = userData._id.toString();

  // ########## grab created names #############
  const nameList = await leanWithStrings(
    Names.find({ createdBy: userId })
      .populate({
        path: "createdBy",
        select: ["name", "profileName", "profileImage"],
      })
      .populate("tags", "tag"),
  );

  //##### grabbing Tags for name edit function ###############

  //##### grabbing DESCRIPTIONS added by user

  const createdDescriptions = await leanWithStrings(
    Descriptions.find({
      createdBy: userId,
    })
      .populate({
        path: "createdBy",
        select: ["name", "profileName", "profileImage"],
      })
      .populate("tags", "tag"),
  );

  console.log("created descriptions", createdDescriptions);

  //TO CALCULATE USERS POINTS

  //### FOLLOWING LIST, followers is grabbed from userData

  // let usersFollowing = await leanWithStrings(
  //   User.find({
  //     followers: userId,
  //   }).select("name followers name profileImage profileName bio location"),
  // );

  let usersLikedContent = [];

  if (session?.user) {
    const userId = session.user.id;
    usersLikedContent = await leanWithStrings(
      NameLikes.find({ userId }).select("nameId -_id"),
    );

    //TODO: change to likes context
  }

  return (
    <Profile
      nameList={JSON.parse(JSON.stringify(nameList))}
      createdDescriptions={JSON.parse(JSON.stringify(createdDescriptions))}
      userData={JSON.parse(JSON.stringify(userData))}
    />
  );
}
