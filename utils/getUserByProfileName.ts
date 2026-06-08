import User, { type IUserDocument } from "@models/User";
import db from "./db";

export async function getUserByProfileName(
  profilename: string,
): Promise<IUserDocument | null> {
  await db.connect();
  const user = await User.findOne({ profileName: profilename.toLowerCase() });
  return user;
}
