import { expect, type APIRequestContext } from "@playwright/test";

const DEFAULT_ORIGIN = "http://localhost:3000";

/** POST NextAuth email sign-in (magic link request). Uses `json: true` for a JSON body instead of redirect. */
export async function postEmailSignIn(
  request: APIRequestContext,
  email: string,
): Promise<{ status: number; url: string | null; error: string | null }> {
  const origin = process.env.NEXTAUTH_URL ?? DEFAULT_ORIGIN;
  const csrfRes = await request.get("/api/auth/csrf");
  expect(csrfRes.ok()).toBeTruthy();
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const response = await request.post("/api/auth/signin/email", {
    form: {
      csrfToken,
      email,
      callbackUrl: `${origin}/dashboard`,
      json: "true",
    },
  });

  const json = (await response.json()) as { url?: string; error?: string };
  return {
    status: response.status(),
    url: json.url ?? null,
    error: json.error ?? null,
  };
}

export function expectSignInRedirectParam(
  url: string | null,
  errorParam: string,
): void {
  expect(url, "expected signIn redirect url").toBeTruthy();
  const parsed = url!.startsWith("http")
    ? new URL(url!)
    : new URL(url!, DEFAULT_ORIGIN);
  expect(parsed.searchParams.get("error")).toBe(errorParam);
}
