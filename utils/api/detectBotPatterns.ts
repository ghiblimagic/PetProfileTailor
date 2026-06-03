const LONG_SINGLE_TOKEN_MAX_LENGTH = 15;
const NAME_MAX_AVG_WORD_LENGTH = 12;
const MESSAGE_MIN_WORD_COUNT = 3;
const MESSAGE_MAX_AVG_WORD_LENGTH = 20;

function hasLongSingleGibberishToken(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  return words.length === 1 && trimmed.length > LONG_SINGLE_TOKEN_MAX_LENGTH;
}

export function detectBotPatterns(text: string): boolean {
  const patterns = [
    /(.)\1{8,}/i,
    /^[A-Z]{15,}$/,
    /^[A-Za-z]{30,}$/,
    /\b(viagra|cialis|casino|forex|crypto|bitcoin|lottery|prize)\b/i,
    /(https?:\/\/|www\.)/gi,
    /<script|<iframe|javascript:/gi,
    /[\u4e00-\u9fa5]{10,}/,
    /[\u0400-\u04FF]{10,}/,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function hasRealisticName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) {
    return false;
  }

  if (hasLongSingleGibberishToken(trimmed)) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  const avgWordLength =
    trimmed.replace(/\s/g, "").length / words.length;

  return avgWordLength <= NAME_MAX_AVG_WORD_LENGTH;
}

export function hasRealisticMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  if (hasLongSingleGibberishToken(trimmed)) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  if (words.length < MESSAGE_MIN_WORD_COUNT) {
    return false;
  }

  const avgWordLength =
    trimmed.replace(/\s/g, "").length / words.length;

  return avgWordLength <= MESSAGE_MAX_AVG_WORD_LENGTH;
}

/** @deprecated Use hasRealisticMessage for contact message bodies. */
export function hasRealisticContent(message: string): boolean {
  return hasRealisticMessage(message);
}

export function hasRealisticContactFields(
  name: string,
  message: string,
): boolean {
  return hasRealisticName(name) && hasRealisticMessage(message);
}
