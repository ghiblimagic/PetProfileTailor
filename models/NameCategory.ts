import mongoose, { Document, Model } from "mongoose";
import "./NameTag";

export interface INameCategory {
  category: string;
  tags: mongoose.Types.ObjectId[];
  order: number;
}

export interface INameCategoryDocument extends INameCategory, Document {}

const NameCategorySchema = new mongoose.Schema<INameCategoryDocument>({
  category: { type: String, required: true, unique: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "NameTag" }],
  order: { type: Number, default: 0 },
});

const NameCategory: Model<INameCategoryDocument> =
  (mongoose.models.NameCategory as Model<INameCategoryDocument>) ||
  mongoose.model<INameCategoryDocument>("NameCategory", NameCategorySchema);

export default NameCategory;
