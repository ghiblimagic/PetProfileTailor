import { act, render, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { vi } from "vitest";
import {
  NotificationsProvider,
  useNotifications,
  type NotificationsContextValue,
} from "./notificationsContext";

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: mocks.useSession,
}));

function NotificationsCapture({
  onCapture,
}: {
  onCapture: (value: NotificationsContextValue) => void;
}) {
  const value = useNotifications();
  useEffect(() => {
    onCapture(value);
  });
  return null;
}

function renderProvider(children?: ReactNode) {
  return render(<NotificationsProvider>{children}</NotificationsProvider>);
}

describe("useNotifications", () => {
  it("throws outside NotificationsProvider", () => {
    mocks.useSession.mockReturnValue({ data: null, status: "unauthenticated" });

    function Orphan() {
      useNotifications();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      /useNotifications must be used within a NotificationsProvider/,
    );
  });
});

describe("NotificationsProvider", () => {
  let api: NotificationsContextValue;

  beforeEach(() => {
    vi.clearAllMocks();
    api = null as unknown as NotificationsContextValue;
    mocks.useSession.mockReturnValue({
      data: { user: { id: "user-1" } },
      status: "authenticated",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ names: 2, descriptions: 1, thanks: 3 }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches unread counts and sets notificationsTotal", async () => {
    renderProvider(<NotificationsCapture onCapture={(v) => (api = v)} />);

    await waitFor(() => {
      expect(api.notificationsTotal).toBe(6);
    });

    expect(api.notifications).toEqual({ names: 2, descriptions: 1, thanks: 3 });
    expect(api.timeGrabbed).toBeInstanceOf(Date);
    expect(fetch).toHaveBeenCalledWith("/api/user/notifications", {
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
  });

  it("clears counts when session ends", async () => {
    const { rerender } = renderProvider(
      <NotificationsCapture onCapture={(v) => (api = v)} />,
    );

    await waitFor(() => {
      expect(api.notificationsTotal).toBe(6);
    });

    mocks.useSession.mockReturnValue({ data: null, status: "unauthenticated" });
    rerender(
      <NotificationsProvider>
        <NotificationsCapture onCapture={(v) => (api = v)} />
      </NotificationsProvider>,
    );

    await waitFor(() => {
      expect(api.notifications).toEqual({
        names: 0,
        descriptions: 0,
        thanks: 0,
      });
      expect(api.notificationsTotal).toBe(0);
      expect(api.timeGrabbed).toBeNull();
    });
  });

  it("resetNotificationType PATCHes mark-read and zeros the type", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ names: 1, descriptions: 0, thanks: 2 }),
    } as Response);

    renderProvider(<NotificationsCapture onCapture={(v) => (api = v)} />);

    await waitFor(() => {
      expect(api.notifications.thanks).toBe(2);
    });

    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    act(() => {
      api.resetNotificationType("thanks");
    });

    expect(api.notifications.thanks).toBe(0);
    expect(api.notificationsTotal).toBe(1);

    expect(fetch).toHaveBeenCalledWith("/api/notifications/thanks/mark-read", {
      method: "PATCH",
    });
  });
});
