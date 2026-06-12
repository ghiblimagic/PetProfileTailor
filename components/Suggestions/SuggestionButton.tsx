"use client";

import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { useSuggestions } from "@context/SuggestionsContext";
import type { ContentType } from "@/utils/api/checkIfValidContentType";
import type { SuggestionContentInfo } from "@/components/Suggestions/AddSuggestion";

export type SuggestionButtonProps = {
  content: SuggestionContentInfo;
  dataType: ContentType | string;
  onClick: (content: SuggestionContentInfo) => void;
};

const SuggestionButton = forwardRef<HTMLButtonElement, SuggestionButtonProps>(
  ({ content, onClick, dataType }, ref) => {
    const { hasSuggested } = useSuggestions();
    const userHasAlreadySuggested = hasSuggested(
      dataType,
      content._id.toString(),
    );
    const suggestedColor = userHasAlreadySuggested ? "yellow" : "white";

    return (
      <button
        ref={ref}
        type="button"
        className="ml-2 mr-6 rounded-sm w-[90%]  group flex items-center hover:bg-blue-500"
        onClick={() => onClick(content)}
      >
        <FontAwesomeIcon
          icon={faLightbulb}
          className="text-xl ml-3 mr-2"
          color={suggestedColor}
        />
        <span>Suggestion</span>
      </button>
    );
  },
);

SuggestionButton.displayName = "SuggestionButton";

export default SuggestionButton;
