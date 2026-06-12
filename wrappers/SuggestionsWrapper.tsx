/**
 * Client shell for SuggestionsProvider (used from server layout).
 * Notes: docs/notes/wrappers/layout-wrappers.md
 */
"use client";

import type { ReactNode } from "react";
import { SuggestionsProvider } from "@/context/SuggestionsContext";

export type SuggestionsWrapperProps = {
  children: ReactNode;
};

export default function SuggestionsWrapper({
  children,
}: SuggestionsWrapperProps) {
  // useEffect(() => {
  //   fetch("/api/user/suggestions", { cache: "no-store" })
  //     .then((res) => res.json())
  //     .then(setSuggestions)
  //     .catch(console.error);
  // }, []);

  return <SuggestionsProvider>{children}</SuggestionsProvider>;
}
