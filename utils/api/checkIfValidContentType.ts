export const validContentTypes = ["names", "descriptions"] as const;

export type ContentType = (typeof validContentTypes)[number];

interface HttpError extends Error {
  status?: number;
}

/**
 * Validates that the given contentType is allowed.
 * Throws an error if invalid.
 */
export function checkIfValidContentType(contentType: string): true {
  if (!(validContentTypes as readonly string[]).includes(contentType)) {
    const error = new Error(`Invalid contentType: ${contentType}`) as HttpError;
    error.status = 400;
    throw error;
  }
  return true;
}
