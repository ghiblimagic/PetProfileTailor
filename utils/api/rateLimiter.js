class RateLimiter {
  constructor() {
    this.records = new Map();
  }

  /**
   * Check if a request should be allowed
   * @param {string} identifier - Usually IP address or user ID
   * @param {Object} options - Configuration options
   * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
   * @param {number} options.maxRequests - Maximum requests allowed in window (default: 5)
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
   */
  check(identifier, options = {}) {
    const { windowMs = 60000, maxRequests = 5 } = options;
    const now = Date.now();

    // Periodic cleanup to prevent memory leaks (5% chance = runs ~once every 20 requests)
    if (Math.random() < 0.05) {
      this.cleanup();
    }
    const record = this.records.get(identifier);

    if (!record || now > record.resetTime) {
      // New window or expired window
      const newRecord = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.records.set(identifier, newRecord);

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }

    // Always increment, even when blocked to catch severe cases of abuse
    record.count++;

    return {
      allowed: record.count <= maxRequests,
      remaining: Math.max(0, maxRequests - record.count),
      resetTime: record.resetTime,
    };
  }

  /**
   * Clean up expired records to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    for (const [identifier, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(identifier);
      }
    }
  }

  /**
   * Manually reset a specific identifier (useful for testing or admin overrides)
   */
  reset(identifier) {
    this.records.delete(identifier);
  }

  /**
   * Get current status without incrementing count
   */
  getStatus(identifier, options = {}) {
    const { windowMs = 60000, maxRequests = 5 } = options;
    const now = Date.now();
    const record = this.records.get(identifier);

    if (!record || now > record.resetTime) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + windowMs,
      };
    }

    return {
      allowed: record.count < maxRequests,
      remaining: Math.max(0, maxRequests - record.count),
      resetTime: record.resetTime,
    };
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter();

// Export different preset configurations
export const rateLimitPresets = {
  strict: { windowMs: 60000, maxRequests: 2 }, // 2 per minute
  normal: { windowMs: 60000, maxRequests: 5 }, // 5 per minute
  relaxed: { windowMs: 60000, maxRequests: 10 }, // 10 per minute
  contact: { windowMs: 300000, maxRequests: 3 }, // 3 per 5 minutes
  auth: { windowMs: 900000, maxRequests: 5 }, // 5 per 15 minutes
};

// Helper function to get client IP
export function getClientIP(headersList) {
  const forwarded = headersList.get("x-forwarded-for");
  const forwardedIP = forwarded?.split(",")[0]?.trim();

  // If x-forwarded-for is an empty string
  // This is the check for that: forwardedIP && forwardedIP.length > 0
  return (
    (forwardedIP && forwardedIP.length > 0 ? forwardedIP : null) ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") ||
    "unknown"
  );
}
