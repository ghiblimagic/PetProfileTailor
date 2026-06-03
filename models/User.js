import mongoose from "mongoose";
import chooseRandomDefaultAvatar from "../utils/chooseRandomDefaultAvatar";

const UserSchema = new mongoose.Schema(
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
    // this way emails are always lowercase, so theres less risk of duplication
    password: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "limited", "suspended", "banned", "pending"],
      default: "active",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
      required: true,
    },
    bio: {
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
      //why no () after chooseRandomDefaultAvatar?
      // Because Mongoose will call it for you every time it needs a default value, so you pass the function, not its result.
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
    strictQuery: false, // Turn off strict mode for query filters
  },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
