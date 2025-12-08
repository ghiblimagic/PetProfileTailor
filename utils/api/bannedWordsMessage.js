export default function bannedWordsMessage(
  content,
  fieldName,
  blockedBy,
  type,
) {
  if (type === "substring") {
    return `Ruh Roh! This content could not be added to ${fieldName} because any content containing the phrase ${blockedBy} is not allowed.`;
  } else if (type === "exact-name") {
    return `Ruh Roh! This content could not be added to ${fieldName}  because the word ${blockedBy} cannot be used by itself.`;
  } else {
    return `Ruh Roh! This content could not be added to ${fieldName} because the word ${blockedBy} is on the blocklist.`;
  }
}
