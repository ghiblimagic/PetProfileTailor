/**
 * Thanks dialog open/close state for listing rows.
 * Notes: docs/notes/hooks/useThanksHandler.md
 */
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export function useThanksHandler({ apiEndpoint }: { apiEndpoint: string }) {
  const [showThanksDialog, setShowThanksDialog] = useState(false);
  const [thanksTarget, setThanksTarget] = useState<string | null>(null);
  const [isSavingThanks, setIsSavingThanks] = useState(false);

  const openThanks = (contentId: string) => {
    if (!contentId) return;
    setThanksTarget(contentId);
    setShowThanksDialog(true);
  };

  const closeThanks = () => {
    setShowThanksDialog(false);
    setThanksTarget(null);
    setIsSavingThanks(false);
  };

  const confirmThanks = async (thanksData: Record<string, unknown>) => {
    if (!thanksTarget) return;

    setIsSavingThanks(true);

    try {
      await axios.put(apiEndpoint, {
        submission: {
          ...thanksData,
          contentId: thanksTarget,
        },
      });

      toast.success("Successfully thanked!");
      closeThanks();
    } catch (error) {
      console.error("Error sending thanks:", error);
      toast.error("Failed to send thanks!");
      setIsSavingThanks(false);
    }
  };

  return {
    showThanksDialog,
    thanksTarget,
    isSavingThanks,
    openThanks,
    closeThanks,
    confirmThanks,
  };
}
