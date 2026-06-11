"use client";

import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag } from "@fortawesome/free-solid-svg-icons";
import { useReports } from "@context/ReportsContext";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

type ListingContent = { _id: string };

export type FlagButtonProps = {
  content: ListingContent;
  dataType: ContentType | string;
  onClick: (content: ListingContent) => void;
  userIsTheCreator?: boolean;
};

const FlagButton = forwardRef<HTMLButtonElement, FlagButtonProps>(
  ({ content, onClick, dataType }, ref) => {
    const { hasReported } = useReports();
    const userHasAlreadyReported = hasReported(
      dataType,
      content._id.toString(),
    );
    const flaggedColor = userHasAlreadyReported ? "red" : "white";

    return (
      <button
        ref={ref}
        type="button"
        className="ml-2 mr-6 rounded-sm w-[90%] group flex items-center hover:bg-blue-500"
        onClick={() => onClick(content)}
      >
        <FontAwesomeIcon
          icon={faFlag}
          className="text-xl ml-3 mr-2"
          color={flaggedColor}
        />
        <span>Report</span>
      </button>
    );
  },
);

FlagButton.displayName = "FlagButton";

export default FlagButton;
