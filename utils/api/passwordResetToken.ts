/**
 * Password-reset token hashing shared by forgot-password, verify, and E2E hooks.
 * Notes: docs/notes/app/api/forgotpassword-route.md
 */
import crypto from "crypto";

export const PASSWORD_RESET_TTL_MS = 3_600_000;

export function hashPasswordResetToken(plainToken: string): string {
  return crypto.createHash("sha256").update(plainToken).digest("hex");
}

export function createPasswordResetToken(nowMs: number = Date.now()): {
  plainToken: string;
  hashedToken: string;
  expiresAt: Date;
} {
  const plainToken = crypto.randomBytes(20).toString("hex");

  return {
    plainToken,
    hashedToken: hashPasswordResetToken(plainToken),
    expiresAt: new Date(nowMs + PASSWORD_RESET_TTL_MS),
  };
}
