import type { Document, Model, PopulateOptions } from "mongoose";
import { leanWithStrings } from "../mongoDataCleanup";

type PaginationOptions = {
  page?: number;
  limit?: number;
};

/** Shared `page` / `limit` parsing for notification API routes. */
export function parseNotificationPagination(
  searchParams: URLSearchParams,
): { page: number; limit: number } {
  return {
    page: parseInt(searchParams.get("page") || "1", 10) || 1,
    limit: parseInt(searchParams.get("limit") || "25", 10) || 25,
  };
}

export async function getPaginatedNotifications<TDoc extends Document>(
  model: Model<TDoc>,
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
