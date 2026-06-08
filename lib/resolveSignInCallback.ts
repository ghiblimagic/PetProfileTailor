import type { UserStatus } from "@models/User";

type SignInUserRecord = { status: UserStatus } | null;

/** Pure signIn branching — extracted for unit tests (no DB / NextAuth imports). */
export function resolveSignInCallback({
  userExists,
  provider,
}: {
  userExists: SignInUserRecord;
  provider: string;
}): boolean | string {
  if (userExists?.status === "banned") {
    return "/login?error=Banned";
  }

  if (provider === "email") {
    return true;
  }

  if (provider === "credentials") {
    return userExists ? true : "/login?error=UserNotFound";
  }

  return true;
}
