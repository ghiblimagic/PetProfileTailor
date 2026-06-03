export default function normalizeString(content: string): string {
  const normalized = content
    .trim()
    .replace(/\s+/g, "")
    // gets rid of all spaces
    .replace(/[^\w\s]/g, "")
    // strip punctuation & special chars
    //[^\w\s] is a negated character class, meaning “anything not a word character (\w) or whitespace (\s)”.
    // So .replace(/[^\w\s]/g, "") removes all punctuation and special characters, leaving only letters, numbers, underscores, and spaces.
    .toLowerCase();
  return normalized;
}
