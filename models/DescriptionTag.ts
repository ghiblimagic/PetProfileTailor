import mongoose, { Document, Model } from "mongoose";

export interface IDescriptionTag {
  tag: string;
  createdBy: mongoose.Types.ObjectId;
}

export interface IDescriptionTagDocument extends IDescriptionTag, Document {}

const DescriptionTagSchema = new mongoose.Schema<IDescriptionTagDocument>({
  tag: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const DescriptionTag: Model<IDescriptionTagDocument> =
  (mongoose.models.DescriptionTag as Model<IDescriptionTagDocument>) ||
  mongoose.model<IDescriptionTagDocument>(
    "DescriptionTag",
    DescriptionTagSchema,
  );

export default DescriptionTag;
