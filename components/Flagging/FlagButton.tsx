"use client";

import { forwardRef } from "react";
import { Flag } from "lucide-react";
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
    const flaggedColor = userHasAlreadyReported
      ? "rgb(248 113 113)"
      : "rgb(221 214 254)";

    return (
      <button
        ref={ref}
        type="button"
        className="ml-2 mr-6 rounded-sm w-[90%] group flex items-center hover:bg-blue-500"
        onClick={() => onClick(content)}
      >
        <Flag size={18} className="ml-3 mr-2" color={flaggedColor} />
        <span>Report</span>
      </button>
    );
  },
);

FlagButton.displayName = "FlagButton";

export default FlagButton;
