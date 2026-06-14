import { vi } from "vitest";
import type { Session } from "next-auth";

const mocks = vi.hoisted(() => ({
  getSessionForApis: vi.fn(),
}));

vi.mock("./getSessionForApis", () => ({
  getSessionForApis: mocks.getSessionForApis,
}));

import { checkOwnership } from "./checkOwnership";

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

describe("checkOwnership", () => {
  it("denies when there is no session", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: false,
      response: Response.json({ message: "Not authenticated" }, { status: 401 }),
    });

    const result = await checkOwnership({ resourceCreatorId: "user-1" });

    expect(result).toEqual({ ok: false });
  });

  it("allows the resource creator", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: session({ id: "creator-42" }),
    });

    const result = await checkOwnership({ resourceCreatorId: "creator-42" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.user.id).toBe("creator-42");
    }
  });

  it("allows an active admin who is not the creator", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: session({ id: "admin-1", role: "admin", status: "active" }),
    });

    const result = await checkOwnership({ resourceCreatorId: "someone-else" });

    expect(result.ok).toBe(true);
  });

  it("denies a non-admin who is not the creator", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: session({ id: "user-9", role: "user", status: "active" }),
    });

    const result = await checkOwnership({ resourceCreatorId: "owner-1" });

    expect(result).toEqual({ ok: false });
  });

  it("denies admin when status is not active", async () => {
    mocks.getSessionForApis.mockResolvedValue({
      ok: true,
      session: session({ id: "admin-1", role: "admin", status: "banned" }),
    });

    const result = await checkOwnership({ resourceCreatorId: "owner-1" });

    expect(result).toEqual({ ok: false });
  });
});
