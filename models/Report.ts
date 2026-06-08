/**
 * Notes: docs/notes/models/moderation-and-thanks.md
 */
import mongoose, { Document, Model } from "mongoose";

export const REPORT_CONTENT_TYPES = ["names", "descriptions", "users"] as const;
export type ReportContentType = (typeof REPORT_CONTENT_TYPES)[number];

export const MODERATION_STATUSES = [
  "pending",
  "under_review",
  "action_required",
  "resolved",
  "dismissed",
  "deleted",
] as const;

export const MODERATION_OUTCOMES = [
  "pending",
  "dismissed",
  "warningIssued",
  "contentRemoved",
  "deletedByUser",
] as const;

export const REPORT_PRIORITIES = [
  "unrated",
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];
export type ModerationOutcome = (typeof MODERATION_OUTCOMES)[number];
export type ReportPriority = (typeof REPORT_PRIORITIES)[number];

export interface IReport {
  contentType: ReportContentType;
  contentId: mongoose.Types.ObjectId;
  contentCopy: Record<string, unknown>;
  contentCreatedBy: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reportCategories: unknown[];
  comments?: string;
  status: ModerationStatus;
  outcome: ModerationOutcome;
  priority: ReportPriority;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportDocument extends IReport, Document {}

export interface IReportModel extends Model<IReportDocument> {
  fieldDescriptions: Record<string, string>;
}

const REPORT_FIELD_DESCRIPTIONS: Record<string, string> = {
  status: "Current stage of moderation workflow",
  outcome: "Result of the moderation review",
  priority: "How urgent or serious the report is",
  reportCategories: "Categories applied by the user when reporting",
  comments: "Optional notes provided by the user",
};

const ReportSchema = new mongoose.Schema<IReportDocument>(
  {
    contentType: {
      type: String,
      enum: REPORT_CONTENT_TYPES,
      required: true,
    },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    contentCopy: { type: Object, default: {}, required: true },
    contentCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    reportCategories: { type: Array, required: true, default: [] },
    comments: { type: String, required: false },
    status: {
      type: String,
      enum: MODERATION_STATUSES,
      default: "pending" satisfies ModerationStatus,
      required: true,
    },
    outcome: {
      type: String,
      enum: MODERATION_OUTCOMES,
      default: "pending" satisfies ModerationOutcome,
    },
    priority: {
      type: String,
      enum: REPORT_PRIORITIES,
      default: "unrated" satisfies ReportPriority,
    },
  },
  {
    timestamps: true,
    statics: { fieldDescriptions: REPORT_FIELD_DESCRIPTIONS },
  },
);

const Report: IReportModel =
  (mongoose.models.Report as IReportModel) ||
  mongoose.model<IReportDocument, IReportModel>("Report", ReportSchema);

export default Report;
