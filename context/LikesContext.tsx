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
import type { UserLikesResponse } from "@/app/api/user/likes/route";

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

export function LikesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const likesRef = useRef<LikesRefData>(emptyLikesRef());
  const recentLikesRef = useRef<RecentLikesRef>({}); // track like adjustments for this session
  // object keyed by contentId, with values -1, 0, or 1
  // { [nameId]: 1 | 0 | -1 }
  // tracks if the likes count has to be updated, important for if the user navigates backwards

  useEffect(() => {
    if (status === "loading") return;

    if (!userId) {
      // reset likes when logged out
      likesRef.current = emptyLikesRef();
      recentLikesRef.current = {};
      return;
    }

    //controller ensures that if your page unmounts or the fetch is canceled during redirect/hydration, the promise cleanly aborts
    // for example when logging in with magic links I kept getting the:
    //TypeError: NetworkError when attempting to fetch resource.

    const controller = new AbortController();

    // fetch likes for the logged-in user
    fetch("/api/user/likes", { cache: "no-store", signal: controller.signal })
      .then((res) => res.json())
      .then((data: UserLikesResponse) => {
        if (!controller.signal.aborted) {
          const names = data?.names || [];
          const descriptions = data?.descriptions || [];

          likesRef.current = {
            names: new Map(names.map((r) => [r.contentId.toString(), null])),
            descriptions: new Map(
              descriptions.map((r) => [r.contentId.toString(), null]),
            ),
          };

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

  // console.log("likesRef in context", likesRef);

  const hasLiked = (type: LikeContentType, contentId: string): boolean => {
    return likesRef.current[type]?.has(contentId.toString()) ?? false;
    // has returns a boolean, true or false
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
    // console.log(
    //   "delete like type",
    //   type,

    //   "delete contentID",
    //   contentId,
    // );
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

//  likesRef usage
// const { likesRef } = useLikes();
// console.log(likesRef.current.names); // Map of name likes

// hasLiked and Add Like
// if (!hasLiked("names", contentId)) {
//   addLike("names", contentId, likeId, "pending");
// }

//  status usage
// const status = getLikeStatus("users", userId);
