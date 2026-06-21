/**
 * E2E only — clear in-memory contact form rate limit for local test IPs.
 */
import { isE2eServerMode } from "@/utils/api/e2eTestMode";
import { resetContactRateLimitForE2e } from "@/utils/api/contactRateLimit";

export async function POST() {
  if (!isE2eServerMode()) {
    return new Response(null, { status: 404 });
  }

  resetContactRateLimitForE2e();
  return Response.json({ ok: true });
}
