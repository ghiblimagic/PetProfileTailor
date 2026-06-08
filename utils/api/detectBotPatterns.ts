const MESSAGE_LONG_SINGLE_TOKEN_MAX_LENGTH = 15;
const MESSAGE_MIN_WORD_COUNT = 3;
const MESSAGE_MAX_AVG_WORD_LENGTH = 20;

/** Shown when the message is not English/Spanish (Latin script). */
export const CONTACT_MESSAGE_LANGUAGE_ERROR =
  "Please write your message in English or Spanish.";

/** Basic Latin + Latin-1 supplement — covers English and Spanish (including á, ñ, ¿, etc.). */
const LATIN_LETTER_REGEX = /[A-Za-z\u00C0-\u00FF]/g;

/** English and Spanish both use Latin script; other languages are rejected at the contact form. */
export function isEnglishOrSpanishScript(text: string): boolean {
  const nonSpace = text.replace(/\s/g, "");
  if (!nonSpace) {
    return false;
  }

  const latinCount = nonSpace.match(LATIN_LETTER_REGEX)?.length ?? 0;
  return latinCount / nonSpace.length >= 0.5;
}

function hasLongSingleGibberishToken(
  text: string,
  maxLength: number,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  if (words.length !== 1 || trimmed.length <= maxLength) {
    return false;
  }

  // Latin-only long tokens (e.g. contact spam); other scripts often omit spaces.
  return /^[A-Za-z]+$/.test(trimmed);
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

  if (!isEnglishOrSpanishScript(trimmed)) {
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
