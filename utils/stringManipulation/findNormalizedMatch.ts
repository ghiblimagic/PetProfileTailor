/**
 * Design notes (regex strategies, index tradeoffs): docs/notes/utils/stringManipulation/findNormalizedMatch.md
 */
import { type Model } from "mongoose";
// necessary for populate (createdBy → User)
import User from "@/models/User";
import normalizeString from "./normalizeString";
void User;

export interface NormalizedContentFields {
  normalizedContent: string;
}

const CREATED_BY_POPULATE = {
  path: "createdBy",
  select: ["name", "profileName", "profileImage"],
} as const;

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Anchored start match — index-friendly; exact prefix after normalization. */
export async function findStartNormalized<T extends NormalizedContentFields>(
  Model: Model<T>,
  content: string,
): Promise<T | null> {
  const normalizedString = normalizeString(content).slice(0, 400);

  console.log("this is normalizedString", normalizedString);

  return (await Model.findOne({
    normalizedContent: {
      $regex: new RegExp("^" + escapeRegex(normalizedString), "i"),
    },
  }).populate(CREATED_BY_POPULATE)) as T | null;
}

/** Non-anchored partial match — scans full collection; avoid when possible. */
export async function findPartialMatch<T extends NormalizedContentFields>(
  Model: Model<T>,
  content: string,
): Promise<T[]> {
  const normalizedString = normalizeString(content).slice(0, 400);

  return (await Model.find({
    normalizedContent: {
      $regex: escapeRegex(normalizedString),
      $options: "i",
    },
  }).populate(CREATED_BY_POPULATE)) as T[];
}

/** Exact normalized duplicate check — preferred for uniqueness validation. */
export async function findExactNormalized<T extends NormalizedContentFields>(
  Model: Model<T>,
  content: string,
): Promise<T | null> {
  const normalizedString = normalizeString(content);
  return (await Model.findOne({
    normalizedContent: normalizedString,
  }).populate(CREATED_BY_POPULATE)) as T | null;
}
