/**
 * Index / collection notes: docs/notes/models/likes-and-follows.md
 */
import mongoose, { Document, Model } from "mongoose";

export interface IDescriptionLike {
  likedBy: mongoose.Types.ObjectId;
  contentCreator: mongoose.Types.ObjectId;
  contentId: mongoose.Types.ObjectId;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDescriptionLikeDocument extends IDescriptionLike, Document {}

const DescriptionLikeSchema = new mongoose.Schema<IDescriptionLikeDocument>(
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
      ref: "Description",
      required: true,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

DescriptionLikeSchema.index({ likedBy: 1, contentId: 1 }, { unique: true });
DescriptionLikeSchema.index({ contentCreator: 1, read: 1, createdAt: -1 });

const DescriptionLike: Model<IDescriptionLikeDocument> =
  (mongoose.models.DescriptionLike as Model<IDescriptionLikeDocument>) ||
  mongoose.model<IDescriptionLikeDocument>(
    "DescriptionLike",
    DescriptionLikeSchema,
    "descriptionlikes",
  );

export default DescriptionLike;
