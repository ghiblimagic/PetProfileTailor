import mongoose, { Document, Model } from "mongoose";
import chooseRandomDefaultAvatar from "../utils/chooseRandomDefaultAvatar";

export const USER_STATUSES = [
  "active",
  "limited",
  "suspended",
  "banned",
  "pending",
] as const;

export const USER_ROLES = ["user", "moderator", "admin"] as const;

// Why "as const" works:
//  as const makes a readonly (can't be accidentely mutated) tuple where the values become literal types, not just strings
// → ex: "active" | "limited" | "suspended" | "banned" | "pending"

// Without as const that would just be string. With it, TypeScript knows exactly which strings are valid, so it can catch typos like "Banned" or "activee" at compile time.

// Mongoose accepts that array for enum.

export type UserStatus = (typeof USER_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export interface IUser {
  name: string;
  profileName: string;
  email: string;
  password?: string;
  // password is optional because its not required for magic link users
  status: UserStatus;
  role: UserRole;
  bio: string;
  location: string;
  over13: boolean;
  profileImage: string;
  passwordResetToken?: string;
  resetTokenExpires?: Date;
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new mongoose.Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: false,
    },
    profileName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active" satisfies UserStatus,
      //  if you ever rename a status, the default line will error at compile time rather than silently becoming invalid.
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "user" satisfies UserRole,
      required: true,
    },    bio: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    over13: {
      type: Boolean,
      required: true,
    },
    profileImage: {
      type: String,
      default: chooseRandomDefaultAvatar,
    },
    passwordResetToken: {
      type: String,
    },
    resetTokenExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: false,
  },
);

const User: Model<IUserDocument> =
  (mongoose.models.User as Model<IUserDocument>) ||
  mongoose.model<IUserDocument>("User", UserSchema);

export default User;
