import mongoose, { Document, Model } from "mongoose";
import "./DescriptionTag";

export interface IDescriptionCategory {
  category: string;
  tags: mongoose.Types.ObjectId[];
}

export interface IDescriptionCategoryDocument
  extends IDescriptionCategory,
    Document {}

const DescriptionCategorySchema =
  new mongoose.Schema<IDescriptionCategoryDocument>({
    category: { type: String, required: true, unique: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "DescriptionTag" }],
  });

const DescriptionCategory: Model<IDescriptionCategoryDocument> =
  (mongoose.models.DescriptionCategory as Model<IDescriptionCategoryDocument>) ||
  mongoose.model<IDescriptionCategoryDocument>(
    "DescriptionCategory",
    DescriptionCategorySchema,
  );

export default DescriptionCategory;
