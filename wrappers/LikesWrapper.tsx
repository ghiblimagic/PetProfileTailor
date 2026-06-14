/**
 * Client shell for LikesProvider (used from server layout).
 * Notes: docs/notes/app/api/user-likes-route.md
 */
"use client";

import type { ReactNode } from "react";
import { LikesProvider } from "@/context/LikesContext";
import type { UserLikesResponse } from "@/utils/api/getUserLikes";

type LikesWrapperProps = {
  children: ReactNode;
  initialLikes?: UserLikesResponse | null;
};

export default function LikesWrapper({
  children,
  initialLikes = null,
}: LikesWrapperProps) {
  return (
    <LikesProvider initialLikes={initialLikes}>{children}</LikesProvider>
  );
}
