/**
 * Like button state — LikesContext + optimistic count + togglelike API.
 * Notes: docs/notes/app/api/togglelike-route.md
 */
import { useState } from "react";
import { useToggleState } from "./useToggleState";
import {
  useLikes,
  type LikeContentType,
  type RecentLikeDelta,
} from "@/context/LikesContext";

export type LikeableContentCreator = {
  _id: string;
  name?: string;
  profileName?: string;
  profileImage?: string;
};

export type LikeableContent = {
  _id: string;
  likedByCount: number;
  createdBy: LikeableContentCreator;
};

export type UseLikeStateParams = {
  data: LikeableContent;
  dataType: LikeContentType;
  /** Passed from callers; not used inside this hook. */
  userId?: string;
  apiBaseLink: string;
};

export function useLikeState({
  data,
  dataType,
  apiBaseLink,
}: UseLikeStateParams) {
  const { hasLiked, addLike, deleteLike, recentLikesRef } = useLikes();

  const contentId = data._id;

  const initialLiked = hasLiked(dataType, contentId); // true, false

  const initialCount = data.likedByCount; // 10

  // Local state only for rendering
  const [likeCount, setLikeCount] = useState(
    initialCount + (recentLikesRef?.current[contentId] || 0),
  );

  function calculateHowCountAdjusts(): RecentLikeDelta {
    // ### Tracking how we're adjusting the likes count to match the server ######
    if (initialLiked && !recentLikesRef.current[contentId]) return -1;
    // it was liked originally, we're unliking it
    if ([1, -1].includes(recentLikesRef.current[contentId])) return 0;
    // change back to default whether it was initiallly liked or not, we're just undoing the clicks we did in this session
    return 1;
    // otherwise like it
  }

  const {
    active: liked,
    isProcessing,
    toggle,
  } = useToggleState<RecentLikeDelta>({
    initialActive: initialLiked,
    body: { contentCreator: data.createdBy },
    apiUrl: `${apiBaseLink}/${contentId}/togglelike`,
    onApplyOptimistic: (newLiked) => {
      // newLiked = true or false, opposite of its initial liked/unliked state
      const originalRecentLike = recentLikesRef.current[contentId] || 0;
      // Save originalRecentLike somewhere we can reuse in rollback, keeping track if they originally:
      // 1. liked during the session: 1,
      // 2. unliked during this session: -1
      // 3. number was === to database state: 0
      const change = calculateHowCountAdjusts();
      recentLikesRef.current[contentId] = change;

      if (newLiked) {
        addLike(dataType, contentId);
        setLikeCount((prev) => prev + 1);
      } else {
        deleteLike(dataType, contentId);
        setLikeCount((prev) => prev - 1);
      }
      // Return originalRecentLike so rollback can use it
      return originalRecentLike;
    },

    onRollback: (originalRecentLike) => {
      // use the saved originalRecentLike from onApplyOptimistic
      if (originalRecentLike === 1) {
        addLike(dataType, contentId);
      }
      if (originalRecentLike === -1) {
        deleteLike(dataType, contentId);
      }

      recentLikesRef.current[contentId] = originalRecentLike;

      const rollbackCount = initialCount + originalRecentLike;

      setLikeCount(rollbackCount);
    },
  });

  return { liked, likeCount, isProcessing, toggleLike: toggle };
}
