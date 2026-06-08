/**
 * Notes: docs/notes/models/moderation-and-thanks.md
 */
import mongoose, { Document, Model } from "mongoose";
import { thanksOptions } from "@/data/ThanksOptions";

export const THANK_CONTENT_TYPES = ["names", "descriptions"] as const;
export type ThankContentType = (typeof THANK_CONTENT_TYPES)[number];

const allowedMessages = thanksOptions.map((option) => option.tag);

export interface IThank {
  contentCreator: mongoose.Types.ObjectId;
  thanksBy: mongoose.Types.ObjectId;
  contentType: ThankContentType;
  nameId?: mongoose.Types.ObjectId | null;
  descriptionId?: mongoose.Types.ObjectId | null;
  read: boolean;
  messages: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IThankDocument extends IThank, Document {}

const ThankSchema = new mongoose.Schema<IThankDocument>(
  {
    contentCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thanksBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: THANK_CONTENT_TYPES,
    },
    nameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Name",
      required: function (this: IThankDocument) {
        return this.contentType === "names";
      },
      default: null,
    },
    descriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Description",
      required: function (this: IThankDocument) {
        // Legacy: singular "description" matches thanks API, not enum value "descriptions"
        return (this.contentType as string) === "description";
      },
      default: null,
    },
    read: { type: Boolean, default: false },
    messages: {
      type: [{ type: String, enum: allowedMessages }],
      required: true,
      default: [],
    },
  },
  { timestamps: true },
);

ThankSchema.index({
  contentCreator: 1,
  nameId: 1,
  descriptionId: 1,
  thanksBy: 1,
});

const Thank: Model<IThankDocument> =
  (mongoose.models.Thank as Model<IThankDocument>) ||
  mongoose.model<IThankDocument>("Thank", ThankSchema, "thanks");

export default Thank;
