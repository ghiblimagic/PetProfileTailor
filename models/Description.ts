/**
 * Schema notes: docs/notes/models/name-and-description.md
 */
import mongoose, { Document, Model } from "mongoose";

export interface IDescription {
  content: string;
  normalizedContent: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  likedByCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDescriptionDocument extends IDescription, Document {}

const DescriptionSchema = new mongoose.Schema<IDescriptionDocument>(
  {
    content: {
      type: String,
      required: true,
      unique: true,
    },
    normalizedContent: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "DescriptionTag",
      },
    ],
    likedByCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Description: Model<IDescriptionDocument> =
  (mongoose.models.Description as Model<IDescriptionDocument>) ||
  mongoose.model<IDescriptionDocument>("Description", DescriptionSchema);

export default Description;
