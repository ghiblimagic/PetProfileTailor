type RateLimitRecord = {
  count: number;
  resetTime: number;
};

export type RateLimitOptions = {
  windowMs?: number;
  maxRequests?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
};

export class RateLimiter {
  private records = new Map<string, RateLimitRecord>();

  check(identifier: string, options: RateLimitOptions = {}): RateLimitResult {
    const { windowMs = 60_000, maxRequests = 5 } = options;
    const now = Date.now();

    if (Math.random() < 0.05) {
      this.cleanup();
    }

    const record = this.records.get(identifier);

    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
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

    record.count++;

    return {
      allowed: record.count <= maxRequests,
      remaining: Math.max(0, maxRequests - record.count),
      resetTime: record.resetTime,
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [identifier, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(identifier);
      }
    }
  }

  reset(identifier: string): void {
    this.records.delete(identifier);
  }

  getStatus(identifier: string, options: RateLimitOptions = {}): RateLimitResult {
    const { windowMs = 60_000, maxRequests = 5 } = options;
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

export const rateLimiter = new RateLimiter();

/** Shared client + server cap for like toggle POSTs (per user / per hook instance). */
export const LIKE_TOGGLE_RATE_LIMIT = {
  windowMs: 120_000,
  maxRequests: 3,
} as const;

export const rateLimitPresets = {
  strict: { windowMs: 60_000, maxRequests: 2 },
  normal: { windowMs: 60_000, maxRequests: 5 },
  relaxed: { windowMs: 60_000, maxRequests: 10 },
  contact: { windowMs: 300_000, maxRequests: 3 },
  auth: { windowMs: 900_000, maxRequests: 5 },
  likeToggle: LIKE_TOGGLE_RATE_LIMIT,
} as const;

export function getClientIP(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  const forwardedIP = forwarded?.split(",")[0]?.trim();

  return (
    (forwardedIP && forwardedIP.length > 0 ? forwardedIP : null) ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") ||
    "unknown"
  );
}
