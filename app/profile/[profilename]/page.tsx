/**
 * Public profile route — load user by profileName and render profile UI.
 * Notes: docs/notes/app/profile-page.md
 */
import dbConnect from "@utils/db";
import Names from "@models/Name";
import Descriptions from "@/models/Description";
import User from "@models/User";
import { getUserFollowers } from "@/utils/api/getUserFollowers";
import Profile, { type ProfileUserData } from "@/components/profile";
import { leanWithStrings } from "@/utils/mongoDataCleanup";

// Register tag models for Mongoose populate
import "@/models/NameTag";
import "@/models/DescriptionTag";

type ProfilePageProps = {
  params: Promise<{ profilename: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { profilename } = await params;

  // console.log("profileName", profilename);
  const usersProfileName = profilename.toLowerCase();

  await dbConnect.connect();

  // ############# FIND A  USER ##################
  const userRecord = await leanWithStrings(
    User.findOne({ profileName: usersProfileName }).select(
      "name profileImage profileName bio location",
    ),
  );

  if (!userRecord) {
    return <div>User not found</div>;
  }

  const followers = await getUserFollowers(userRecord._id);
  const userId = userRecord._id.toString();

  const userData: ProfileUserData = {
    ...userRecord,
    followers,
  };

  // ########## grab created names #############
  const nameList =
    (await leanWithStrings(
      Names.find({ createdBy: userId })
        .populate({
          path: "createdBy",
          select: ["name", "profileName", "profileImage"],
        })
        .populate("tags", "tag"),
    )) ?? [];

  //##### grabbing Tags for name edit function ###############

  //##### grabbing DESCRIPTIONS added by user

  const createdDescriptions =
    (await leanWithStrings(
      Descriptions.find({
        createdBy: userId,
      })
        .populate({
          path: "createdBy",
          select: ["name", "profileName", "profileImage"],
        })
        .populate("tags", "tag"),
    )) ?? [];

  //TO CALCULATE USERS POINTS

  //### FOLLOWING LIST, followers is grabbed from userData

  // let usersFollowing = await getUserFollowing(userId);

  return (
    <Profile
      nameList={nameList}
      createdDescriptions={createdDescriptions}
      userData={userData}
    />
  );
}
