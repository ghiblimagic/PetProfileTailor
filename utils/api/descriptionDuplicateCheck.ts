/**
 * Duplicate-description guard logic from app/api/description/route.ts
 */

export function shouldCheckDescriptionDuplicate(
  content: string,
  existingContent?: string | null,
): boolean {
  return Boolean(
    content?.toLowerCase() &&
      content.toLowerCase() !== existingContent?.toLowerCase(),
  );
}

export function duplicateDescriptionConflict<T>(
  existingDescriptionCheck: T | null,
): { message: string; existingDescription: T } | null {
  if (!existingDescriptionCheck) return null;

  return {
    message: "Ruh Roh! This description already exists!",
    existingDescription: existingDescriptionCheck,
  };
}
