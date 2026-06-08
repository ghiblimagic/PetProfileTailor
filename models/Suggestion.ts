/**
 * Notes: docs/notes/models/moderation-and-thanks.md
 */
import mongoose, { Document, Model } from "mongoose";

export const SUGGESTION_STATUSES = [
  "pending",
  "under_review",
  "action_required",
  "resolved",
  "dismissed",
  "deleted",
] as const;

export const SUGGESTION_OUTCOMES = [
  "pending",
  "dismissed",
  "warningIssued",
  "contentRemoved",
  "deletedByUser",
] as const;

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];
export type SuggestionOutcome = (typeof SUGGESTION_OUTCOMES)[number];

export interface ISuggestion {
  contentType: string;
  contentId: mongoose.Types.ObjectId;
  contentCreator: mongoose.Types.ObjectId;
  suggestionBy: mongoose.Types.ObjectId;
  categories: unknown[];
  description?: string;
  comments?: string;
  incorrectNameTags: mongoose.Types.ObjectId[];
  incorrectDescriptionTags: mongoose.Types.ObjectId[];
  nameTagsSuggested: mongoose.Types.ObjectId[];
  descriptionTagsSuggested: mongoose.Types.ObjectId[];
  status: SuggestionStatus;
  outcome: SuggestionOutcome;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISuggestionDocument extends ISuggestion, Document {}

export interface ISuggestionModel extends Model<ISuggestionDocument> {
  fieldDescriptions: Record<string, string>;
}

const SUGGESTION_FIELD_DESCRIPTIONS: Record<string, string> = {
  status: "Current stage of moderation workflow",
  outcome: "Result of the moderation review",
  priority: "How urgent or serious the report is",
  ideaCategories:
    "Categories applied by the user when sending in their suggested changes",
  comments: "Optional notes provided by the user",
};

const SuggestionSchema = new mongoose.Schema<ISuggestionDocument>(
  {
    contentType: { type: String, required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    contentCreator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    suggestionBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    categories: { type: Array, required: true, default: [] },
    description: { type: String },
    comments: { type: String },
    incorrectNameTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "NameTag",
      },
    ],
    incorrectDescriptionTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "DescriptionTag",
      },
    ],
    nameTagsSuggested: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "NameTag",
      },
    ],
    descriptionTagsSuggested: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
        ref: "DescriptionTag",
      },
    ],
    status: {
      type: String,
      enum: SUGGESTION_STATUSES,
      default: "pending" satisfies SuggestionStatus,
      required: true,
    },
    outcome: {
      type: String,
      enum: SUGGESTION_OUTCOMES,
      default: "pending" satisfies SuggestionOutcome,
      required: true,
    },
  },
  {
    timestamps: true,
    statics: { fieldDescriptions: SUGGESTION_FIELD_DESCRIPTIONS },
  },
);

const Suggestion: ISuggestionModel =
  (mongoose.models.Suggestion as ISuggestionModel) ||
  mongoose.model<ISuggestionDocument, ISuggestionModel>(
    "Suggestion",
    SuggestionSchema,
  );

export default Suggestion;
