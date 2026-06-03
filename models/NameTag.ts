import mongoose, { Document, Model } from "mongoose";

export interface INameTag {
  tag: string;
  createdBy?: mongoose.Types.ObjectId;
}

export interface INameTagDocument extends INameTag, Document {}

const NameTagSchema = new mongoose.Schema<INameTagDocument>({
  tag: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const NameTag: Model<INameTagDocument> =
  (mongoose.models.NameTag as Model<INameTagDocument>) ||
  mongoose.model<INameTagDocument>("NameTag", NameTagSchema);

export default NameTag;
