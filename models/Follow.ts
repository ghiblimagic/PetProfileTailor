/**
 * Index / collection notes: docs/notes/models/likes-and-follows.md
 */
import mongoose, { Document, Model } from "mongoose";

export interface IFollow {
  userId: mongoose.Types.ObjectId;
  followedBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFollowDocument extends IFollow, Document {}

const FollowSchema = new mongoose.Schema<IFollowDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

FollowSchema.index({ userId: 1, followedBy: 1 }, { unique: true });

const Follow: Model<IFollowDocument> =
  (mongoose.models.Follow as Model<IFollowDocument>) ||
  mongoose.model<IFollowDocument>("Follow", FollowSchema, "follows");

export default Follow;
