import type { Model, PopulateOptions } from "mongoose";
import { leanWithStrings } from "../mongoDataCleanup";

type PaginationOptions = {
  page?: number;
  limit?: number;
};

export async function getPaginatedNotifications(
  model: Model<unknown>,
  filter: Record<string, unknown> = {},
  populateOptions: PopulateOptions | PopulateOptions[] = [],
  { page = 1, limit = 25 }: PaginationOptions = {},
) {
  const skip = (page - 1) * limit;

  return leanWithStrings(
    model
      .find(filter)
      .populate(populateOptions)
      .sort({ read: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
  );
}
