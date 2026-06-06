/**
 * Deep design notes: docs/notes/utils/mongoDataCleanup.md
 */
import mongoose, { type Query } from "mongoose";

type OmitV<T> = T extends object ? Omit<T, "__v"> : T;

export type MongoCleanupResult<T> = T extends mongoose.Types.ObjectId
  ? string
  : T extends mongoose.Types.ObjectId[]
    ? string[]
    : T extends Date
      ? Date
      : T extends readonly (infer U)[]
        ? MongoCleanupResult<U>[]
        : T extends object
          ? {
              [K in keyof OmitV<T>]: MongoCleanupResult<OmitV<T>[K]>;
            }
          : T;

/**
 * Recursively converts a Mongoose lean result into plain JS:
 * - ObjectIds stringified (including arrays of ObjectIds)
 * - __v removed
 * - Dates left as Date (Next.js serializes them when passing to client components)
 */
function deepTransform<T>(obj: T): MongoCleanupResult<T> {
  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString() as MongoCleanupResult<T>;
  }

  if (obj instanceof Date) {
    return obj as MongoCleanupResult<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepTransform(item)) as MongoCleanupResult<T>;
  }

  if (obj && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__v") {
        continue;
      }
      newObj[key] = deepTransform(value);
    }
    return newObj as MongoCleanupResult<T>;
  }

  return obj as MongoCleanupResult<T>;
}

type LeanQuery<TReturn> = {
  lean(): { exec(): Promise<TReturn> };
};

/**
 * Runs query.lean().exec(), then deepTransform on the result.
 */
export async function leanWithStrings<TReturn>(
  query: Query<TReturn, unknown> | LeanQuery<TReturn>,
): Promise<MongoCleanupResult<TReturn> | null> {
  const result = await query.lean().exec();

  if (Array.isArray(result)) {
    return result.map((doc) =>
      deepTransform(doc),
    ) as MongoCleanupResult<TReturn>;
  }

  if (result) {
    return deepTransform(result) as MongoCleanupResult<TReturn>;
  }

  return null;
}
