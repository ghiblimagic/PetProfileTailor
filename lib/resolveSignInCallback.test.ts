import { resolveSignInCallback } from "./resolveSignInCallback";

describe("resolveSignInCallback", () => {
  it("redirects banned users", () => {
    expect(
      resolveSignInCallback({
        userExists: { status: "banned" },
        provider: "credentials",
      }),
    ).toBe("/login?error=Banned");
  });

  it("allows email provider when user is not banned", () => {
    expect(
      resolveSignInCallback({
        userExists: { status: "active" },
        provider: "email",
      }),
    ).toBe(true);
  });

  it("rejects credentials when user does not exist", () => {
    expect(
      resolveSignInCallback({
        userExists: null,
        provider: "credentials",
      }),
    ).toBe("/login?error=UserNotFound");
  });

  it("allows credentials when user exists", () => {
    expect(
      resolveSignInCallback({
        userExists: { status: "active" },
        provider: "credentials",
      }),
    ).toBe(true);
  });
});
