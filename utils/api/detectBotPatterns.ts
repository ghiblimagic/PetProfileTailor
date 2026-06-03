const MESSAGE_LONG_SINGLE_TOKEN_MAX_LENGTH = 15;
const MESSAGE_MIN_WORD_COUNT = 3;
const MESSAGE_MAX_AVG_WORD_LENGTH = 20;

function hasLongSingleGibberishToken(
  text: string,
  maxLength: number,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  return words.length === 1 && trimmed.length > maxLength;
}

export function detectBotPatterns(text: string): boolean {
  // Scoring approach rather than a single-match bail-out because some signals
  // (e.g. a URL) are legitimate on their own but suspicious in combination.
  const rules: { pattern: RegExp; score: number }[] = [
    {
      // Any single character repeated 9+ times in a row e.g. "aaaaaaaaa"
      pattern: /(.)\1{8,}/,
      score: 3,
    },
    {
      // All-caps string of 15+ characters with nothing else e.g. "AAABBBCCCDDDEEE"
      pattern: /^[A-Z]{15,}$/,
      score: 2,
    },
    {
      // Single unbroken letter string 19+ chars — almost never a real word
      pattern: /^[A-Za-z]{19,}$/,
      score: 3,
    },
    {
      // Classic spam keywords
      pattern: /\b(viagra|cialis|casino|forex|crypto|bitcoin|lottery|prize)\b/i,
      score: 3,
    },
    {
      // URL present — low score alone, suspicious combined with other signals
      pattern: /(https?:\/\/|www\.)/i,
      score: 1,
    },
    {
      // Injection attack signatures
      pattern: /<script|<iframe|javascript:/i,
      score: 5,
    },
  ];

  const THRESHOLD = 3;

  const score = rules.reduce(
    (total, { pattern, score }) => total + (pattern.test(text) ? score : 0),
    0
  );

  return score >= THRESHOLD;
}

export function hasRealisticName(name: string): boolean {
  return name.trim().length > 0;
}

export function hasRealisticMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  if (
    hasLongSingleGibberishToken(
      trimmed,
      MESSAGE_LONG_SINGLE_TOKEN_MAX_LENGTH,
    )
  ) {
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
