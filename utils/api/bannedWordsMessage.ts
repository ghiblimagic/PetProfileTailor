type BlockType = "substring" | "exact-name" | string;

export default function bannedWordsMessage(
  content: string,
  fieldName: string,
  blockedBy: string,
  type: BlockType,
): string {
  if (type === "substring") {
    return `Ruh Roh! This content could not be added to ${fieldName} because any content containing the phrase ${blockedBy} is not allowed.`;
  }
  if (type === "exact-name") {
    return `Ruh Roh! This content could not be added to ${fieldName}  because the word ${blockedBy} cannot be used by itself.`;
  }
  return `Ruh Roh! This content could not be added to ${fieldName} because the word ${blockedBy} is on the blocklist.`;
}
