import {
  checkLikeToggleRateLimit,
  E2E_STRICT_LIKE_RATE_LIMIT_HEADER,
  isStrictLikeRateLimitRequest,
  likeToggleRateLimitResponse,
  resetLikeToggleRateLimit,
} from "./likeToggleRateLimit";
import {
  LIKE_TOGGLE_RATE_LIMIT,
  rateLimiter,
  rateLimitPresets,
} from "./rateLimiter";

vi.mock("./e2eTestMode", () => ({
  isE2eServerMode: vi.fn(),
}));

import { isE2eServerMode } from "./e2eTestMode";

describe("likeToggleRateLimitResponse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 429 JSON with retryAfterSeconds at least 1", async () => {
    const now = 1_700_000_000_000;
    vi.setSystemTime(now);

    const response = likeToggleRateLimitResponse(now + 500);
    expect(response.status).toBe(429);

    const body = (await response.json()) as {
      message: string;
      retryAfterSeconds: number;
    };
    expect(body.message).toMatch(/too many like updates/i);
    expect(body.retryAfterSeconds).toBe(1);
  });

  it("ceilings partial seconds until reset", async () => {
    const now = 1_700_000_000_000;
    vi.setSystemTime(now);

    const response = likeToggleRateLimitResponse(now + 2_500);
    const body = (await response.json()) as { retryAfterSeconds: number };
    expect(body.retryAfterSeconds).toBe(3);
  });
});

describe("isStrictLikeRateLimitRequest", () => {
  it("returns true in e2e mode when strict header is 1", () => {
    vi.mocked(isE2eServerMode).mockReturnValue(true);
    const req = new Request("http://localhost", {
      headers: { [E2E_STRICT_LIKE_RATE_LIMIT_HEADER]: "1" },
    });

    expect(isStrictLikeRateLimitRequest(req)).toBe(true);
  });

  it("returns false without e2e mode or header", () => {
    vi.mocked(isE2eServerMode).mockReturnValue(false);
    const req = new Request("http://localhost", {
      headers: { [E2E_STRICT_LIKE_RATE_LIMIT_HEADER]: "1" },
    });

    expect(isStrictLikeRateLimitRequest(req)).toBe(false);
  });
});

describe("checkLikeToggleRateLimit", () => {
  beforeEach(() => {
    resetLikeToggleRateLimit("user-like-test");
    vi.mocked(isE2eServerMode).mockReturnValue(false);
  });

  it("uses production preset outside e2e mode", () => {
    const checkSpy = vi.spyOn(rateLimiter, "check");

    checkLikeToggleRateLimit("user-like-test");

    expect(checkSpy).toHaveBeenCalledWith(
      "like-toggle:user-like-test",
      rateLimitPresets.likeToggle,
    );
  });

  it("uses relaxed preset in e2e mode without strict option", () => {
    vi.mocked(isE2eServerMode).mockReturnValue(true);
    const checkSpy = vi.spyOn(rateLimiter, "check");

    checkLikeToggleRateLimit("user-like-test");

    expect(checkSpy).toHaveBeenCalledWith("like-toggle:user-like-test", {
      windowMs: LIKE_TOGGLE_RATE_LIMIT.windowMs,
      maxRequests: 200,
    });
  });

  it("uses production preset in e2e mode when strict option is set", () => {
    vi.mocked(isE2eServerMode).mockReturnValue(true);
    const checkSpy = vi.spyOn(rateLimiter, "check");

    checkLikeToggleRateLimit("user-like-test", { strict: true });

    expect(checkSpy).toHaveBeenCalledWith(
      "like-toggle:user-like-test",
      rateLimitPresets.likeToggle,
    );
  });
});
