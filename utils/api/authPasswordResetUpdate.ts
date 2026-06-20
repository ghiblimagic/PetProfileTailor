/**
 * Pure helpers for unauthenticated password reset via PUT /api/auth/update.
 * Notes: docs/notes/app/api/auth-update-route.md
 */

export type PasswordResetUpdateInput = {
  password?: string;
  userid?: string;
};

export function normalizeAuthUpdateEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** True when an unauthenticated caller is attempting a token-gated password reset. */
export function isUnauthenticatedPasswordResetAttempt(
  input: PasswordResetUpdateInput,
): boolean {
  return Boolean(input.password && input.userid);
}

/** Mongo filter for a user eligible to complete password reset without a session. */
export function buildPasswordResetUserFilter(
  userid: string,
  email: string,
  nowMs: number = Date.now(),
) {
  return {
    _id: userid,
    email: normalizeAuthUpdateEmail(email),
    passwordResetToken: { $exists: true, $ne: null },
    resetTokenExpires: { $gt: nowMs },
  };
}

/** Mongo filter for POST /api/verifyresetpasstoken. */
export function buildVerifyResetTokenFilter(
  hashedToken: string,
  nowMs: number = Date.now(),
) {
  return {
    passwordResetToken: hashedToken,
    resetTokenExpires: { $gt: nowMs },
  };
}
