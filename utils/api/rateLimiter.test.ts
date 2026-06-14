import {
  RateLimiter,
  getClientIP,
  rateLimitPresets,
} from "./rateLimiter";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = new RateLimiter();
    const options = { windowMs: 60_000, maxRequests: 2 };

    expect(limiter.check("ip-1", options).allowed).toBe(true);
    expect(limiter.check("ip-1", options).allowed).toBe(true);
    expect(limiter.check("ip-1", options).allowed).toBe(false);
  });

  it("resets after the window expires", () => {
    const limiter = new RateLimiter();
    const options = { windowMs: 100, maxRequests: 1 };

    expect(limiter.check("ip-2", options).allowed).toBe(true);
    expect(limiter.check("ip-2", options).allowed).toBe(false);

    const status = limiter.getStatus("ip-2", options);
    const waitMs = status.resetTime - Date.now() + 5;
    vi.advanceTimersByTime(waitMs);

    expect(limiter.check("ip-2", options).allowed).toBe(true);
  });

  it("exposes contact preset used by sendContactEmail", () => {
    expect(rateLimitPresets.contact).toEqual({
      windowMs: 300_000,
      maxRequests: 3,
    });
  });
});

describe("getClientIP", () => {
  it("prefers the first x-forwarded-for address", () => {
    const headers = new Headers({
      "x-forwarded-for": " 203.0.113.1 , 198.51.100.2",
    });

    expect(getClientIP(headers)).toBe("203.0.113.1");
  });

  it("falls back to unknown when no proxy headers exist", () => {
    expect(getClientIP(new Headers())).toBe("unknown");
  });
});
