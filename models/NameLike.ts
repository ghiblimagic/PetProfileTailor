/**
 * Index / collection notes: docs/notes/models/likes-and-follows.md
 */
import mongoose, { Document, Model } from "mongoose";

export interface INameLike {
  likedBy: mongoose.Types.ObjectId;
  contentCreator: mongoose.Types.ObjectId;
  contentId: mongoose.Types.ObjectId;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INameLikeDocument extends INameLike, Document {}

const NameLikeSchema = new mongoose.Schema<INameLikeDocument>(
  {
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Name",
      required: true,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NameLikeSchema.index({ likedBy: 1, contentId: 1 }, { unique: true });
NameLikeSchema.index({ contentCreator: 1, read: 1, createdAt: -1 });

const NameLike: Model<INameLikeDocument> =
  (mongoose.models.NameLike as Model<INameLikeDocument>) ||
  mongoose.model<INameLikeDocument>("NameLike", NameLikeSchema, "namelikes");

export default NameLike;
