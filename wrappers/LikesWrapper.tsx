/**
 * Client shell for LikesProvider (used from server layout).
 * Notes: docs/notes/app/api/user-likes-route.md
 */
"use client";

import type { ReactNode } from "react";
import { LikesProvider } from "@/context/LikesContext";

type LikesWrapperProps = {
  children: ReactNode;
};

export default function LikesWrapper({ children }: LikesWrapperProps) {
  return <LikesProvider>{children}</LikesProvider>;
}
