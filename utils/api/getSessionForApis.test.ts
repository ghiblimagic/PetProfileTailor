import type { Session } from "next-auth";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  mockAuthOptions: { providers: [], callbacks: {} },
}));

vi.mock("next-auth/next", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  serverAuthOptions: mocks.mockAuthOptions,
}));

import { getSessionForApis } from "./getSessionForApis";

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

describe("getSessionForApis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getServerSession with serverAuthOptions", async () => {
    mocks.getServerSession.mockResolvedValue(session());

    await getSessionForApis();

    expect(mocks.getServerSession).toHaveBeenCalledWith(mocks.mockAuthOptions);
  });

  it("returns ok: false with 401 when there is no session", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const result = await getSessionForApis();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        message: "Not authenticated",
      });
    }
  });

  it("returns ok: true with session when authenticated", async () => {
    const activeSession = session({ id: "creator-42", role: "admin" });
    mocks.getServerSession.mockResolvedValue(activeSession);

    const result = await getSessionForApis();

    expect(result).toEqual({ ok: true, session: activeSession });
  });

  it("accepts optional req/res without passing them to getServerSession", async () => {
    mocks.getServerSession.mockResolvedValue(session());
    const req = new Request("http://localhost/api/test");

    await getSessionForApis({ req, res: {} });

    expect(mocks.getServerSession).toHaveBeenCalledTimes(1);
    expect(mocks.getServerSession).toHaveBeenCalledWith(mocks.mockAuthOptions);
  });
});
