/**
 * Client cache of the user's pending suggestions by content id.
 * Notes: docs/notes/models/moderation-and-thanks.md
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
import type { ContentType } from "@/utils/api/checkIfValidContentType";

type SuggestionMapEntry = {
  suggestionId?: string;
  status: string;
};

type SuggestionsRefData = Record<"names" | "descriptions", Map<string, SuggestionMapEntry>>;

export type SuggestionsContextValue = {
  suggestionsRef: MutableRefObject<SuggestionsRefData>;
  hasSuggested: (type: ContentType | string, contentId: string) => boolean;
  getSuggestionStatus: (
    type: ContentType | string,
    contentId: string,
  ) => string | null;
  addSuggestion: (
    type: ContentType | string,
    contentId: string,
    suggestionId: string,
    status?: string,
  ) => void;
  deleteSuggestion: (
    type: ContentType | string,
    contentId: string,
    suggestionId: string,
  ) => void;
};

type UserSuggestionApiEntry = {
  contentId?: string;
  _id?: string;
  status?: string;
};

type UserSuggestionsResponse = {
  names?: UserSuggestionApiEntry[];
  descriptions?: UserSuggestionApiEntry[];
};

const emptySuggestionsRef = (): SuggestionsRefData => ({
  names: new Map(),
  descriptions: new Map(),
});

const SuggestionsContext = createContext<SuggestionsContextValue | null>(null);

export function useSuggestions(): SuggestionsContextValue {
  const context = useContext(SuggestionsContext);
  if (!context) {
    throw new Error("useSuggestions must be used within a SuggestionsProvider");
  }
  return context;
}

export function SuggestionsProvider({
  children,
}: {
  children: ReactNode;
  /** Reserved — not used yet. */
  initialSuggestions?: Record<string, unknown>;
}) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const suggestionsRef = useRef<SuggestionsRefData>(emptySuggestionsRef());

  useEffect(() => {
    if (status === "loading") return;

    if (!userId) {
      suggestionsRef.current.names.clear();
      suggestionsRef.current.descriptions.clear();
      return;
    }

    const controller = new AbortController();

    fetch("/api/user/suggestions", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: UserSuggestionsResponse) => {
        if (!controller.signal.aborted) {
          const { names = [], descriptions = [] } = data;
          suggestionsRef.current.names = new Map(
            names.map((r) => [
              r?.contentId?.toString() ?? "",
              {
                suggestionId: r._id?.toString?.(),
                status: r.status || "pending",
              },
            ]),
          );
          suggestionsRef.current.descriptions = new Map(
            descriptions.map((r) => [
              r?.contentId?.toString() ?? "",
              {
                suggestionId: r._id?.toString?.(),
                status: r.status || "pending",
              },
            ]),
          );
        }
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") console.error(err);
      });

    return () => controller.abort();
  }, [userId, status]);

  const hasSuggested = (type: ContentType | string, contentId: string) => {
    const map = suggestionsRef.current[type as keyof SuggestionsRefData];
    if (!map) return false;
    return map.has(contentId.toString());
  };

  const getSuggestionStatus = (type: ContentType | string, contentId: string) => {
    const map = suggestionsRef.current[type as keyof SuggestionsRefData];
    if (!map) return null;
    return map.get(contentId.toString())?.status ?? null;
  };

  const addSuggestion = (
    type: ContentType | string,
    contentId: string,
    suggestionId: string,
    suggestionStatus = "pending",
  ) => {
    const map = suggestionsRef.current[type as keyof SuggestionsRefData];
    if (!map) return;
    map.set(contentId.toString(), { suggestionId, status: suggestionStatus });
  };

  const deleteSuggestion = (
    type: ContentType | string,
    contentId: string,
    suggestionId: string,
  ) => {
    const map = suggestionsRef.current[type as keyof SuggestionsRefData];
    if (!map) return;

    const value = map.get(contentId.toString());
    if (value && value.suggestionId === suggestionId) {
      map.delete(contentId.toString());
    }
  };

  return (
    <SuggestionsContext.Provider
      value={{
        suggestionsRef,
        hasSuggested,
        getSuggestionStatus,
        addSuggestion,
        deleteSuggestion,
      }}
    >
      {children}
    </SuggestionsContext.Provider>
  );
}
