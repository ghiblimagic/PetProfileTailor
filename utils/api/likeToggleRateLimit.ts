import {
  rateLimiter,
  rateLimitPresets,
  LIKE_TOGGLE_RATE_LIMIT,
} from "./rateLimiter";
import { isE2eServerMode } from "./e2eTestMode";

export { LIKE_TOGGLE_RATE_LIMIT };

/** E2E only — apply production like-toggle cap on togglelike POSTs. */
export const E2E_STRICT_LIKE_RATE_LIMIT_HEADER = "x-e2e-strict-like-rate-limit";

/** Serial E2E runs many togglelike POSTs per user; production cap stays strict. */
const E2E_LIKE_TOGGLE_RATE_LIMIT = {
  windowMs: LIKE_TOGGLE_RATE_LIMIT.windowMs,
  maxRequests: 50,
} as const;

type CheckLikeToggleRateLimitOptions = {
  strict?: boolean;
};

export function isStrictLikeRateLimitRequest(req: Request): boolean {
  return (
    isE2eServerMode() &&
    req.headers.get(E2E_STRICT_LIKE_RATE_LIMIT_HEADER) === "1"
  );
}

export function checkLikeToggleRateLimit(
  userId: string,
  options: CheckLikeToggleRateLimitOptions = {},
) {
  const useProductionCap = options.strict || !isE2eServerMode();
  const preset = useProductionCap
    ? rateLimitPresets.likeToggle
    : E2E_LIKE_TOGGLE_RATE_LIMIT;
  return rateLimiter.check(`like-toggle:${userId}`, preset);
}

export function checkLikeToggleRateLimitForRequest(userId: string, req: Request) {
  return checkLikeToggleRateLimit(userId, {
    strict: isStrictLikeRateLimitRequest(req),
  });
}

export function resetLikeToggleRateLimit(userId: string): void {
  rateLimiter.reset(`like-toggle:${userId}`);
}

export function likeToggleRateLimitResponse(resetTime: number): Response {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((resetTime - Date.now()) / 1000),
  );

  return Response.json(
    {
      message: "Too many like updates. Please try again soon.",
      retryAfterSeconds,
    },
    { status: 429 },
  );
}
