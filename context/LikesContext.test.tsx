import { render, waitFor } from "@testing-library/react";
import { useEffect, useState, type ReactNode } from "react";
import { vi } from "vitest";
import {
  LikesProvider,
  useLikes,
  type LikesContextValue,
} from "./LikesContext";
import type { UserLikesResponse } from "@/utils/api/userLikesResponse";

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: mocks.useSession,
}));

const initialLikes: UserLikesResponse = {
  names: [{ id: "like-1", contentId: "name-abc" }],
  descriptions: [{ id: "like-2", contentId: "desc-xyz" }],
};

/** Ref-based context — capture API for assertions without relying on re-renders. */
function LikesCapture({
  onCapture,
}: {
  onCapture: (value: LikesContextValue) => void;
}) {
  const value = useLikes();
  useEffect(() => {
    onCapture(value);
  });
  return null;
}

/** Polls hasLiked until fetch/async effects settle (refs do not trigger re-renders). */
function LikesPoll({
  predicate,
  onDone,
}: {
  predicate: (api: LikesContextValue) => boolean;
  onDone: () => void;
}) {
  const api = useLikes();
  const [, tick] = useState(0);

  useEffect(() => {
    if (predicate(api)) {
      onDone();
      return;
    }
    const id = window.setInterval(() => tick((n) => n + 1), 10);
    return () => window.clearInterval(id);
  });

  return null;
}

function renderProvider(
  props: { initialLikes?: UserLikesResponse | null } = {},
  children?: ReactNode,
) {
  return render(
    <LikesProvider initialLikes={props.initialLikes}>
      {children}
    </LikesProvider>,
  );
}

describe("useLikes", () => {
  it("throws outside LikesProvider", () => {
    mocks.useSession.mockReturnValue({ data: null, status: "unauthenticated" });

    function Orphan() {
      useLikes();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      /useLikes must be used within a LikesProvider/,
    );
  });
});

describe("LikesProvider", () => {
  let api: LikesContextValue;

  beforeEach(() => {
    vi.clearAllMocks();
    api = null as unknown as LikesContextValue;
    mocks.useSession.mockReturnValue({
      data: { user: { id: "user-1" } },
      status: "authenticated",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          names: [{ id: "fetched", contentId: "name-fetched" }],
          descriptions: [],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates hasLiked from initialLikes without fetching", () => {
    renderProvider(
      { initialLikes },
      <LikesCapture onCapture={(v) => (api = v)} />,
    );

    expect(api.hasLiked("names", "name-abc")).toBe(true);
    expect(api.hasLiked("descriptions", "desc-xyz")).toBe(true);
    expect(api.getLikedIds("names")).toEqual(["name-abc"]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches likes when authenticated without initialLikes", async () => {
    let done = false;

    renderProvider(
      {},
      <>
        <LikesCapture onCapture={(v) => (api = v)} />
        <LikesPoll
          predicate={(v) => v.hasLiked("names", "name-fetched")}
          onDone={() => {
            done = true;
          }}
        />
      </>,
    );

    await waitFor(() => expect(done).toBe(true));

    expect(fetch).toHaveBeenCalledWith("/api/user/likes", {
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
    expect(api.getLikedIds("names")).toEqual(["name-fetched"]);
  });

  it("addLike and deleteLike update the ref maps", () => {
    renderProvider(
      { initialLikes },
      <LikesCapture onCapture={(v) => (api = v)} />,
    );

    expect(api.hasLiked("names", "name-abc")).toBe(true);

    api.deleteLike("names", "name-abc");
    expect(api.hasLiked("names", "name-abc")).toBe(false);

    api.addLike("names", "name-new");
    expect(api.hasLiked("names", "name-new")).toBe(true);
    expect(api.getLikedIds("names")).toEqual(["name-new"]);
  });

  it("clears likes when session logs out", async () => {
    let done = false;

    const { rerender } = render(
      <LikesProvider initialLikes={initialLikes}>
        <LikesCapture onCapture={(v) => (api = v)} />
        <LikesPoll
          predicate={(v) => !v.hasLiked("names", "name-abc")}
          onDone={() => {
            done = true;
          }}
        />
      </LikesProvider>,
    );

    expect(api.hasLiked("names", "name-abc")).toBe(true);

    mocks.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    rerender(
      <LikesProvider initialLikes={initialLikes}>
        <LikesCapture onCapture={(v) => (api = v)} />
        <LikesPoll
          predicate={(v) => !v.hasLiked("names", "name-abc")}
          onDone={() => {
            done = true;
          }}
        />
      </LikesProvider>,
    );

    await waitFor(() => expect(done).toBe(true));
    expect(api.getLikedIds("names")).toEqual([]);
  });

  it("fetches after client login when SSR prefetch was skipped on logout", async () => {
    mocks.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    const { rerender } = render(
      <LikesProvider initialLikes={initialLikes}>
        <LikesCapture onCapture={(v) => (api = v)} />
      </LikesProvider>,
    );

    expect(api.hasLiked("names", "name-abc")).toBe(false);

    mocks.useSession.mockReturnValue({
      data: { user: { id: "user-1" } },
      status: "authenticated",
    });

    let done = false;

    rerender(
      <LikesProvider initialLikes={initialLikes}>
        <LikesCapture onCapture={(v) => (api = v)} />
        <LikesPoll
          predicate={(v) => v.hasLiked("names", "name-fetched")}
          onDone={() => {
            done = true;
          }}
        />
      </LikesProvider>,
    );

    await waitFor(() => expect(done).toBe(true));
    expect(fetch).toHaveBeenCalled();
  });
});
