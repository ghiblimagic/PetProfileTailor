/**
 * Client cache of the user's liked name/description ids + session toggle deltas.
 * Notes: docs/notes/app/api/user-likes-route.md
 */
"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { useSession } from "next-auth/react";
import {
  buildLikesMapsFromResponse,
  type UserLikesResponse,
} from "@/utils/api/userLikesResponse";

export type LikeContentType = "names" | "descriptions";

type LikesMap = Map<string, null>;

type LikesRefData = {
  names: LikesMap;
  descriptions: LikesMap;
};

/** Per contentId session delta for displayed like count: -1, 0, or 1 */
export type RecentLikeDelta = -1 | 0 | 1;

export type RecentLikesRef = Record<string, RecentLikeDelta>;

export type LikesContextValue = {
  likesRef: MutableRefObject<LikesRefData>;
  getLikedIds: (type: LikeContentType) => string[];
  recentLikesRef: MutableRefObject<RecentLikesRef>;
  hasLiked: (type: LikeContentType, contentId: string) => boolean;
  addLike: (type: LikeContentType, contentId: string) => void;
  deleteLike: (type: LikeContentType, contentId: string) => void;
};

const emptyLikesRef = (): LikesRefData => ({
  names: new Map(),
  descriptions: new Map(),
});

const LikesContext = createContext<LikesContextValue | null>(null);

export function useLikes(): LikesContextValue {
  const context = useContext(LikesContext);
  if (!context) throw new Error("useLikes must be used within a LikesProvider");
  return context;
}

type LikesProviderProps = {
  children: ReactNode;
  /** Server-prefetched likes from root layout — skips first client fetch when present. */
  initialLikes?: UserLikesResponse | null;
};

export function LikesProvider({ children, initialLikes }: LikesProviderProps) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // Hydrate from server prefetch when layout passed initialLikes (correct hearts on first paint)
  const likesRef = useRef<LikesRefData>(
    initialLikes ? buildLikesMapsFromResponse(initialLikes) : emptyLikesRef(),
  );
  const recentLikesRef = useRef<RecentLikesRef>({}); // track like adjustments for this session
  // object keyed by contentId, with values -1, 0, or 1
  // { [nameId]: 1 | 0 | -1 }
  // tracks if the likes count has to be updated, important for if the user navigates backwards
  const skipInitialFetchRef = useRef(initialLikes != null);

  useEffect(() => {
    if (status === "loading") return;

    if (!userId) {
      // reset likes when logged out
      likesRef.current = emptyLikesRef();
      recentLikesRef.current = {};
      skipInitialFetchRef.current = false; // next login should fetch (unless new SSR prefetch)
      return;
    }

    // Root layout already seeded likesRef — skip redundant GET on this mount
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }

    // controller ensures that if your page unmounts or the fetch is canceled during redirect/hydration, the promise cleanly aborts
    // for example when logging in with magic links I kept getting the:
    // TypeError: NetworkError when attempting to fetch resource.
    const controller = new AbortController();

    // fetch likes for the logged-in user (client-only login — no SSR initialLikes)
    fetch("/api/user/likes", { cache: "no-store", signal: controller.signal })
      .then((res) => res.json())
      .then((data: UserLikesResponse) => {
        if (!controller.signal.aborted) {
          likesRef.current = buildLikesMapsFromResponse(data);
          recentLikesRef.current = {};
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.error(err);
        }
      });

    return () => controller.abort();
  }, [userId, status]);

  const getLikedIds = (type: LikeContentType): string[] => {
    return Array.from(likesRef.current[type]?.keys() || []);
  };

  const hasLiked = (type: LikeContentType, contentId: string): boolean => {
    return likesRef.current[type]?.has(contentId.toString()) ?? false;
  };

  // const getLikeStatus = (type, contentId) => {
  //   const map = likesRef.current[type];
  //   if (!map) return null;
  //   return map.get(contentId.toString())?.status ?? null;
  // };

  const addLike = (type: LikeContentType, contentId: string) => {
    likesRef.current[type]?.set(contentId.toString(), null);
  };

  const deleteLike = (type: LikeContentType, contentId: string) => {
    likesRef.current[type]?.delete(contentId.toString());
  };

  return (
    <LikesContext.Provider
      value={{
        likesRef,
        getLikedIds,
        recentLikesRef,
        hasLiked,
        addLike,
        deleteLike,
      }}
    >
      {children}
    </LikesContext.Provider>
  );
}

// likesRef usage
// const { likesRef } = useLikes();
// console.log(likesRef.current.names); // Map of name likes

// hasLiked and addLike
// if (!hasLiked("names", contentId)) {
//   addLike("names", contentId);
// }

// status usage (legacy — maps no longer store status)
// const status = getLikeStatus("names", contentId);
