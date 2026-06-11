import { forwardRef } from "react";
import type { MouseEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

type ListingContent = { _id: string };

export type EditButtonProps = {
  content: ListingContent;
  /** Legacy prop name kept for existing callers. */
  onupdateEditState?: (
    content: ListingContent,
    e: MouseEvent<HTMLButtonElement>,
  ) => void;
  className?: string;
};

const EditButton = forwardRef<HTMLButtonElement, EditButtonProps>(
  ({ content, onupdateEditState, className }, ref) => (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => onupdateEditState?.(content, e)}
    >
      <FontAwesomeIcon
        icon={faPencil}
        className="text-xl w-4 h-4 mr-2"
      />
      <span>Edit</span>
    </button>
  ),
);

EditButton.displayName = "EditButton";

export default EditButton;
