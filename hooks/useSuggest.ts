/**
 * Suggestion dialog open/close state for listing rows.
 * Notes: docs/notes/hooks/useSuggest.md
 */
import { useState } from "react";

type ListingContent = { _id: string };

export function useSuggest() {
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [suggestionTarget, setSuggestionTarget] =
    useState<ListingContent | null>(null);

  function openSuggestion(content: ListingContent) {
    setSuggestionTarget(content);
    setShowSuggestionDialog(true);
  }

  function closeSuggestion() {
    setSuggestionTarget(null);
    setShowSuggestionDialog(false);
  }

  return {
    showSuggestionDialog,
    suggestionTarget,
    openSuggestion,
    closeSuggestion,
  };
}
