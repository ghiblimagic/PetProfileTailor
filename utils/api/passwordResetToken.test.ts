/**
 * @vitest-environment node
 */
import crypto from "crypto";
import {
  PASSWORD_RESET_TTL_MS,
  createPasswordResetToken,
  hashPasswordResetToken,
} from "./passwordResetToken";

describe("hashPasswordResetToken", () => {
  it("returns sha256 hex of the plain token", () => {
    const plain = "abc123";
    const expected = crypto
      .createHash("sha256")
      .update(plain)
      .digest("hex");

    expect(hashPasswordResetToken(plain)).toBe(expected);
  });

  it("matches hashing used when storing tokens from email links", () => {
    const plain = crypto.randomBytes(20).toString("hex");
    expect(hashPasswordResetToken(plain)).toHaveLength(64);
    expect(hashPasswordResetToken(plain)).toBe(hashPasswordResetToken(plain));
  });
});

describe("createPasswordResetToken", () => {
  it("returns plain + hashed pair with expiry one hour ahead", () => {
    const now = 1_700_000_000_000;
    const { plainToken, hashedToken, expiresAt } = createPasswordResetToken(now);

    expect(plainToken).toMatch(/^[a-f0-9]{40}$/);
    expect(hashedToken).toBe(hashPasswordResetToken(plainToken));
    expect(expiresAt.getTime()).toBe(now + PASSWORD_RESET_TTL_MS);
  });
});
