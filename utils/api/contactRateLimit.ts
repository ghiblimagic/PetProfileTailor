import { rateLimiter } from "./rateLimiter";

/** Clear all in-memory rate-limit buckets (E2E contact + like-toggle share one limiter). */
export function resetContactRateLimitForE2e(): void {
  rateLimiter.resetAll();
}
