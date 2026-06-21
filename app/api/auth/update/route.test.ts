/**
 * @vitest-environment node
 */
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionForApis: vi.fn(),
  connect: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
  hashSync: vi.fn(() => "hashed-password"),
}));

vi.mock("@/utils/api/getSessionForApis", () => ({
  getSessionForApis: mocks.getSessionForApis,
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

vi.mock("bcryptjs", () => ({
  default: { hashSync: mocks.hashSync },
}));

import { PUT } from "./route";

function putRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/auth/update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connect.mockResolvedValue(undefined);
  });

  it("returns 422 when name or email is invalid", async () => {
    const response = await PUT(
      putRequest({ name: "", email: "not-an-email", password: "secret" }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      message: "Validation error",
    });
  });

  it("returns 401 when unauthenticated without password reset fields", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: false,
      response: Response.json({ message: "Not authenticated" }, { status: 401 }),
    });

    const response = await PUT(
      putRequest({ name: "Ada", email: "ada@example.com" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Not authenticated",
    });
  });

  it("returns 401 when reset token user is not found", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: false,
      response: Response.json({ message: "Not authenticated" }, { status: 401 }),
    });
    mocks.findOne.mockResolvedValue(null);

    const response = await PUT(
      putRequest({
        name: "Ada",
        email: "ada@example.com",
        password: "newpass",
        userid: "user-1",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "user-1",
        email: "ada@example.com",
        passwordResetToken: { $exists: true, $ne: null },
        resetTokenExpires: { $gt: expect.any(Number) },
      }),
    );
    await expect(response.json()).resolves.toEqual({
      message: "Invalid or expired reset token",
    });
  });

  it("updates password for unauthenticated reset when token user exists", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: false,
      response: Response.json({ message: "Not authenticated" }, { status: 401 }),
    });

    const save = vi.fn().mockResolvedValue(undefined);
    const resetUser = {
      name: "Old Name",
      password: "old-hash",
      passwordResetToken: "hashed-token",
      resetTokenExpires: new Date(Date.now() + 3600000),
      save,
    };
    mocks.findOne.mockResolvedValue(resetUser);

    const response = await PUT(
      putRequest({
        name: "New Name",
        email: "Ada@Example.com",
        password: "newpass",
        userid: "user-1",
      }),
    );

    expect(response.status).toBe(200);
    expect(resetUser.name).toBe("New Name");
    expect(resetUser.password).toBe("hashed-password");
    expect(resetUser.passwordResetToken).toBeUndefined();
    expect(resetUser.resetTokenExpires).toBeUndefined();
    expect(mocks.hashSync).toHaveBeenCalledWith("newpass");
    expect(save).toHaveBeenCalled();
  });

  it("updates authenticated user name and email", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: {
        expires: "2099-01-01",
        user: { id: "user-1", role: "user", status: "active" },
      },
    });

    const save = vi.fn().mockResolvedValue(undefined);
    const toUpdateUser = {
      name: "Old",
      email: "old@example.com",
      save,
    };
    mocks.findById.mockResolvedValue(toUpdateUser);

    const response = await PUT(
      putRequest({
        name: "Updated",
        email: "updated@example.com",
      }),
    );

    expect(response.status).toBe(200);
    expect(toUpdateUser.name).toBe("Updated");
    expect(toUpdateUser.email).toBe("updated@example.com");
    expect(save).toHaveBeenCalled();
  });
});
