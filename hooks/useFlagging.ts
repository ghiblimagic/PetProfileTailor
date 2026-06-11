/**
 * Flag/report dialog open/close state for listing rows.
 * Notes: docs/notes/hooks/useFlagging.md
 */
import { useState } from "react";

type ListingContent = { _id: string };

export function useFlagging() {
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagTarget, setFlagTarget] = useState<ListingContent | null>(null);

  function openFlag(content: ListingContent) {
    setFlagTarget(content);
    setShowFlagDialog(true);
  }

  function closeFlag() {
    setFlagTarget(null);
    setShowFlagDialog(false);
  }

  return {
    showFlagDialog,
    flagTarget,
    openFlag,
    closeFlag,
  };
}
