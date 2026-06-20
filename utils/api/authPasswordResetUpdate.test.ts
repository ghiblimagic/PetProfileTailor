import {
  buildPasswordResetUserFilter,
  buildVerifyResetTokenFilter,
  isUnauthenticatedPasswordResetAttempt,
  normalizeAuthUpdateEmail,
} from "./authPasswordResetUpdate";

describe("normalizeAuthUpdateEmail", () => {
  it("lowercases and trims email", () => {
    expect(normalizeAuthUpdateEmail("  User@Example.COM ")).toBe(
      "user@example.com",
    );
  });
});

describe("isUnauthenticatedPasswordResetAttempt", () => {
  it("requires both password and userid", () => {
    expect(
      isUnauthenticatedPasswordResetAttempt({
        password: "secret",
        userid: "abc",
      }),
    ).toBe(true);
    expect(isUnauthenticatedPasswordResetAttempt({ password: "secret" })).toBe(
      false,
    );
    expect(isUnauthenticatedPasswordResetAttempt({ userid: "abc" })).toBe(false);
    expect(isUnauthenticatedPasswordResetAttempt({})).toBe(false);
  });
});

describe("buildPasswordResetUserFilter", () => {
  const nowMs = 1_700_000_000_000;

  it("matches userid, normalized email, token present, and future expiry", () => {
    expect(
      buildPasswordResetUserFilter("user-id-1", "  Test@Mail.com ", nowMs),
    ).toEqual({
      _id: "user-id-1",
      email: "test@mail.com",
      passwordResetToken: { $exists: true, $ne: null },
      resetTokenExpires: { $gt: nowMs },
    });
  });
});

describe("buildVerifyResetTokenFilter", () => {
  it("matches hashed token with future expiry", () => {
    const nowMs = 1_700_000_000_000;
    expect(buildVerifyResetTokenFilter("hashed-token", nowMs)).toEqual({
      passwordResetToken: "hashed-token",
      resetTokenExpires: { $gt: nowMs },
    });
  });
});
