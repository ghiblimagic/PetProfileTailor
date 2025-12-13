export function detectBotPatterns(text) {
  const patterns = [
    /(.)\1{8,}/i, // 8+ repeated characters (e.g., "aaaaaaaaaa")
    /^[A-Z]{15,}$/, // All caps, 15+ chars, no spaces (e.g., "XRYSUQWMKWD")
    /^[A-Za-z]{30,}$/, // 30+ letters with NO spaces (catches random strings)
    /\b(viagra|cialis|casino|forex|crypto|bitcoin|lottery|prize)\b/i, // Spam keywords
    /(https?:\/\/|www\.)/gi, // URLs in message
    /<script|<iframe|javascript:/gi, // Script injection
    /[\u4e00-\u9fa5]{10,}/, // 10+ Chinese characters (if not expected)
    /[\u0400-\u04FF]{10,}/, // 10+ Cyrillic characters (if not expected)
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function hasRealisticContent(message) {
  // Message should have spaces (real sentences)
  const words = message.trim().split(/\s+/);
  if (words.length === 1 && message.length > 15) {
    // Single "word" longer than 15 chars = likely random string
    return false;
  }

  // Check for minimum word count
  if (words.length < 3) {
    return false;
  }

  // Check average word length (random strings tend to be longer)
  const avgWordLength = message.replace(/\s/g, "").length / words.length;
  if (avgWordLength > 20) {
    return false;
  }

  return true;
}
