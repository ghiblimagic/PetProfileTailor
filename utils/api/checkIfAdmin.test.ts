import { vi } from "vitest";
import type { Session } from "next-auth";

const mocks = vi.hoisted(() => ({
  getSessionForApis: vi.fn(),
}));

vi.mock("./getSessionForApis", () => ({
  getSessionForApis: mocks.getSessionForApis,
}));

import { checkIfAdmin } from "./checkIfAdmin";

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: "2099-01-01",
    user: {
      id: "user-1",
      role: "user",
      status: "active",
      ...overrides,
    },
  };
}

describe("checkIfAdmin", () => {
  it("returns the auth failure when unauthenticated", async () => {
    const failure = {
      ok: false as const,
      response: Response.json({ message: "Not authenticated" }, { status: 401 }),
    };
    mocks.getSessionForApis.mockResolvedValue(failure);

    const result = await checkIfAdmin();

    expect(result).toBe(failure);
  });

  it("returns 403 for a signed-in non-admin", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: session({ role: "user", status: "active" }),
    });

    const result = await checkIfAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        message: "Unauthorized, you must be an admin to complete this action",
      });
    }
  });

  it("returns 403 for admin when status is not active", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: session({ role: "admin", status: "banned" }),
    });

    const result = await checkIfAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("allows an active admin", async () => {
    const adminSession = session({ id: "admin-1", role: "admin", status: "active" });
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: adminSession,
    });

    const result = await checkIfAdmin();

    expect(result).toEqual({ ok: true, session: adminSession });
  });
});
