/**
 * Collection / unique index notes: docs/notes/models/name-and-description.md
 */
import mongoose, { Document, Model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

export interface IName {
  content: string;
  normalizedContent: string;
  notes?: string;
  tags: mongoose.Types.ObjectId[];
  likedByCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INameDocument extends IName, Document {}

const NameSchema = new mongoose.Schema<INameDocument>(
  {
    content: {
      type: String,
      required: true,
      unique: true,
    },
    normalizedContent: {
      type: String,
      required: true,
      unique: true,
    },
    notes: {
      type: String,
      required: false,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "NameTag",
      },
    ],
    likedByCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true },
);

NameSchema.plugin(uniqueValidator);

const Name: Model<INameDocument> =
  (mongoose.models.Name as Model<INameDocument>) ||
  mongoose.model<INameDocument>("Name", NameSchema, "names");

export default Name;
