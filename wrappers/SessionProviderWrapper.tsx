/**
 * Client shell for next-auth SessionProvider (used from server layout).
 * Notes: docs/notes/wrappers/layout-wrappers.md
 */
"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export type SessionProviderWrapperProps = {
  session: Session | null;
  children: ReactNode;
};

export function SessionProviderWrapper({
  session,
  children,
}: SessionProviderWrapperProps) {
  // console.log("session in session provider wrapper", session);
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
