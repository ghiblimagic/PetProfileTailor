"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import AddSuggestion from "@/components/Suggestions/AddSuggestion";
import { useSuggestions } from "@context/SuggestionsContext";
import EditSuggestion from "@components/Suggestions/EditSuggestion";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

type ListingContent = { _id: string };

type SuggestionsContextValue = {
  getSuggestionStatus: (type: string, contentId: string) => string | null;
};

export type SuggestionDialogProps = {
  dataType: ContentType | string;
  open: boolean;
  target: ListingContent | null;
  onClose: () => void;
  signedInUsersId?: string;
  contentId: string;
};

export default function SuggestionDialog({
  dataType,
  open,
  target,
  onClose,
  signedInUsersId,
  contentId,
}: SuggestionDialogProps) {
  const { getSuggestionStatus } = useSuggestions() as SuggestionsContextValue;

  if (!open || !target) return null;

  const suggestionStatus = getSuggestionStatus(dataType, contentId.toString());

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      className="relative z-50 "
    >
      <div
        className="fixed inset-0 bg-black/50 overflow-y-auto"
        aria-hidden="true"
        tabIndex={0}
      >
        <DialogPanel
          className=" bg-secondary sm:p-12 bg-opacity-40 h-fit"
          onClick={(e) => e.stopPropagation()}
        >
          {suggestionStatus === null && (
            <AddSuggestion
              dataType={dataType}
              contentInfo={target}
              apisuggestionSubmission="/api/suggestion/"
              suggestionBy={signedInUsersId}
              onClose={onClose}
            />
          )}
          {suggestionStatus === "pending" && (
            <EditSuggestion
              dataType={dataType}
              contentInfo={target}
              suggestionBy={signedInUsersId}
              apisuggestionSubmission="/api/suggestion/"
              onClose={onClose}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
