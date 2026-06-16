import type { Session, User } from "next-auth";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
  compareSync: vi.fn(),
  resolveSignInCallback: vi.fn(),
}));

vi.mock("@utils/db", () => ({
  default: { connect: mocks.connect },
}));

vi.mock("@models/User", () => ({
  default: {
    findOne: mocks.findOne,
    findById: mocks.findById,
  },
}));

vi.mock("@/app/api/auth/lib/mongodb", () => ({
  default: Promise.resolve({}),
}));

vi.mock("@next-auth/mongodb-adapter", () => ({
  MongoDBAdapter: vi.fn(() => ({})),
}));

vi.mock("@/lib/send-verification-request", () => ({
  sendVerificationRequest: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { compareSync: mocks.compareSync },
}));

vi.mock("./resolveSignInCallback", () => ({
  resolveSignInCallback: mocks.resolveSignInCallback,
}));

import { serverAuthOptions } from "./auth";

function credentialsAuthorize() {
  const provider = serverAuthOptions.providers?.find(
    (p) => (p as { id?: string }).id === "credentials",
  ) as
    | (CredentialsConfig & { options?: { authorize?: CredentialsConfig["authorize"] } })
    | undefined;

  const authorize = provider?.options?.authorize ?? provider?.authorize;
  if (typeof authorize !== "function") {
    throw new Error("credentials authorize missing");
  }
  return authorize;
}

function signInUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    profileName: "testuser",
    profileImage: "/avatar.png",
    role: "user",
    status: "active",
    ...overrides,
  };
}

describe("serverAuthOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connect.mockResolvedValue(undefined);
  });

  describe("signIn callback", () => {
    it("delegates to resolveSignInCallback with DB user and provider", async () => {
      mocks.findOne.mockResolvedValue({ status: "active" });
      mocks.resolveSignInCallback.mockReturnValue(true);

      const signIn = serverAuthOptions.callbacks!.signIn!;
      const result = await signIn({
        user: { email: "user@example.com" },
        account: { provider: "credentials", type: "credentials" },
      });

      expect(mocks.connect).toHaveBeenCalled();
      expect(mocks.findOne).toHaveBeenCalledWith({ email: "user@example.com" });
      expect(mocks.resolveSignInCallback).toHaveBeenCalledWith({
        userExists: { status: "active" },
        provider: "credentials",
      });
      expect(result).toBe(true);
    });

    it("passes null userExists when email is not in DB", async () => {
      mocks.findOne.mockResolvedValue(null);
      mocks.resolveSignInCallback.mockReturnValue("/login?error=UserNotFound");

      const signIn = serverAuthOptions.callbacks!.signIn!;
      const result = await signIn({
        user: { email: "missing@example.com" },
        account: { provider: "credentials", type: "credentials" },
      });

      expect(mocks.resolveSignInCallback).toHaveBeenCalledWith({
        userExists: null,
        provider: "credentials",
      });
      expect(result).toBe("/login?error=UserNotFound");
    });

    it("returns DBUnavailable when connect or findOne throws", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mocks.findOne.mockRejectedValue(new Error("db down"));

      const signIn = serverAuthOptions.callbacks!.signIn!;
      const result = await signIn({
        user: { email: "user@example.com" },
        account: { provider: "email", type: "email" },
      });

      expect(result).toBe("/login?error=DBUnavailable");
      errorSpy.mockRestore();
    });
  });

  describe("jwt callback", () => {
    it("stores token.user from sign-in user", async () => {
      const jwt = serverAuthOptions.callbacks!.jwt!;
      const user = signInUser({ bio: "hello", location: "NYC" });

      const token = await jwt({
        token: {},
        user,
        trigger: "signIn",
        session: undefined,
      });

      expect(token.user).toEqual({
        id: user.id,
        name: user.name,
        profileName: user.profileName,
        bio: user.bio,
        location: user.location,
        profileImage: user.profileImage,
        role: user.role,
        status: user.status,
      });
    });

    it("merges session.user on trigger update", async () => {
      mocks.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({ status: "active" }),
      });

      const jwt = serverAuthOptions.callbacks!.jwt!;
      const token = await jwt({
        token: { user: { id: "user-1", name: "Old", status: "active" } },
        user: undefined,
        trigger: "update",
        session: { user: { name: "New Name", bio: "updated" } },
      });

      expect(token.user).toMatchObject({
        id: "user-1",
        name: "New Name",
        bio: "updated",
        status: "active",
      });
    });

    it("refreshes status from DB when token has user id", async () => {
      mocks.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({ status: "banned" }),
      });

      const jwt = serverAuthOptions.callbacks!.jwt!;
      const token = await jwt({
        token: { user: { id: "user-1", status: "active" } },
        user: undefined,
        trigger: undefined,
        session: undefined,
      });

      expect(mocks.findById).toHaveBeenCalledWith("user-1");
      expect(token.user?.status).toBe("banned");
    });

    it("clears token.user when DB user is deleted", async () => {
      mocks.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const jwt = serverAuthOptions.callbacks!.jwt!;
      const token = await jwt({
        token: { user: { id: "user-1", status: "active" } },
        user: undefined,
        trigger: undefined,
        session: undefined,
      });

      expect(token.user).toBeNull();
    });

    it("leaves token unchanged when status refresh throws", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mocks.findById.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error("db error")),
      });

      const jwt = serverAuthOptions.callbacks!.jwt!;
      const existing = { user: { id: "user-1", status: "active" as const } };
      const token = await jwt({
        token: existing,
        user: undefined,
        trigger: undefined,
        session: undefined,
      });

      expect(token).toEqual(existing);
      errorSpy.mockRestore();
    });
  });

  describe("session callback", () => {
    it("copies token.user onto session", async () => {
      const sessionCb = serverAuthOptions.callbacks!.session!;
      const tokenUser: Session["user"] = {
        id: "user-1",
        name: "Test",
        profileName: "test",
        role: "user",
        status: "active",
      };

      const result = await sessionCb({
        session: { expires: "2099-01-01", user: {} as Session["user"] },
        token: { user: tokenUser },
      });

      expect(result?.user).toEqual(tokenUser);
    });

    it("returns null when session has no user", async () => {
      const sessionCb = serverAuthOptions.callbacks!.session!;

      const result = await sessionCb({
        session: { expires: "2099-01-01", user: undefined as unknown as Session["user"] },
        token: {},
      });

      expect(result).toBeNull();
    });
  });

  describe("credentials authorize", () => {
    it("throws when email or password is missing", async () => {
      const authorize = credentialsAuthorize();

      await expect(authorize({}, {})).rejects.toThrow(
        "Invalid email or password",
      );
      await expect(
        authorize({ email: "a@b.com" }, {}),
      ).rejects.toThrow("Invalid email or password");
    });

    it("throws when user is not found", async () => {
      mocks.findOne.mockResolvedValue(null);
      const authorize = credentialsAuthorize();

      await expect(
        authorize({ email: "a@b.com", password: "secret" }, {}),
      ).rejects.toThrow("Invalid email or password");
    });

    it("throws when user is banned", async () => {
      mocks.findOne.mockResolvedValue({
        _id: { toString: () => "user-1" },
        status: "banned",
        password: "hash",
      });
      const authorize = credentialsAuthorize();

      await expect(
        authorize({ email: "a@b.com", password: "secret" }, {}),
      ).rejects.toThrow("This account has been banned");
    });

    it("throws when password is missing or does not match", async () => {
      mocks.findOne.mockResolvedValue({
        _id: { toString: () => "user-1" },
        status: "active",
        password: "hash",
        name: "Test",
        profileName: "test",
        email: "a@b.com",
        profileImage: "/a.png",
        role: "user",
      });
      mocks.compareSync.mockReturnValue(false);
      const authorize = credentialsAuthorize();

      await expect(
        authorize({ email: "a@b.com", password: "wrong" }, {}),
      ).rejects.toThrow("Invalid email or password");

      mocks.findOne.mockResolvedValue({
        _id: { toString: () => "user-1" },
        status: "active",
        password: undefined,
        name: "Test",
        profileName: "test",
        email: "a@b.com",
        profileImage: "/a.png",
        role: "user",
      });

      await expect(
        authorize({ email: "a@b.com", password: "secret" }, {}),
      ).rejects.toThrow("Invalid email or password");
    });

    it("returns credentials user with string id when password matches", async () => {
      mocks.findOne.mockResolvedValue({
        _id: { toString: () => "mongo-id-99" },
        status: "active",
        password: "hash",
        name: "Test User",
        profileName: "testuser",
        email: "a@b.com",
        profileImage: "/avatar.png",
        role: "admin",
      });
      mocks.compareSync.mockReturnValue(true);
      const authorize = credentialsAuthorize();

      const result = await authorize(
        { email: "a@b.com", password: "secret" },
        {},
      );

      expect(mocks.compareSync).toHaveBeenCalledWith("secret", "hash");
      expect(result).toEqual({
        id: "mongo-id-99",
        name: "Test User",
        profileName: "testuser",
        email: "a@b.com",
        profileImage: "/avatar.png",
        role: "admin",
        status: "active",
      });
    });
  });
});
