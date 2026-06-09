/**
 * Pure name validation used by app/api/names/route.ts (testable without DB).
 */

export const NAME_MAX_LENGTH = 50;

export type NameValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateNameLength(content: string): NameValidationResult {
  if (content.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `Ruh Roh! The name ${content} has more than 50 characters. It is ${content.length} characters`,
    };
  }
  return { ok: true };
}

/** PUT: run blocklist when either field is being updated. */
export function shouldRunNameBlocklistOnUpdate(
  content: string,
  notes?: string,
): boolean {
  return Boolean(content || notes);
}

/** PUT: re-check uniqueness only when content text changes (case-insensitive). */
export function shouldRecheckNameDuplicateOnUpdate(
  content: string,
  existingContent: string,
): boolean {
  return Boolean(
    content && content.toLowerCase() !== existingContent.toLowerCase(),
  );
}

export function formatNameDuplicateMessage(content: string): string {
  return `Ruh Roh! The name ${content} already exists!`;
}

export function formatNameInvalidCharsMessage(
  content: string,
  invalidChars: string[] | null,
): string {
  return `Ruh Roh! The name ${content} has invalid character(s) ${invalidChars}`;
}
