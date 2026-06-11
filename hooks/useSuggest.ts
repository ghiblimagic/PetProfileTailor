/**
 * Suggestion dialog open/close state for listing rows.
 * Notes: docs/notes/hooks/useSuggest.md
 */
import { useState } from "react";
import type { SuggestionContentInfo } from "@/components/Suggestions/AddSuggestion";

export function useSuggest() {
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [suggestionTarget, setSuggestionTarget] =
    useState<SuggestionContentInfo | null>(null);

  function openSuggestion(content: SuggestionContentInfo) {
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
