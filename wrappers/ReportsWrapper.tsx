/**
 * Client shell for ReportsProvider (used from server layout).
 * Notes: docs/notes/wrappers/layout-wrappers.md
 */
"use client";

import type { ReactNode } from "react";
import { ReportsProvider } from "@/context/ReportsContext";

export type ReportsWrapperProps = {
  children: ReactNode;
};

export default function ReportsWrapper({ children }: ReportsWrapperProps) {
  return <ReportsProvider>{children}</ReportsProvider>;
}
