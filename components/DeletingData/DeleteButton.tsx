import { forwardRef } from "react";
import type { MouseEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";

type ListingContent = { _id: string };

export type DeleteButtonProps = {
  content: ListingContent;
  onDeleteClick?: (
    content: ListingContent,
    e: MouseEvent<HTMLButtonElement>,
  ) => void;
  className?: string;
};

const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
  ({ content, onDeleteClick, className }, ref) => (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => onDeleteClick?.(content, e)}
    >
      <FontAwesomeIcon
        icon={faTrashCan}
        className="text-xl w-4 h-4 mr-2"
      />
      <span> Delete</span>
    </button>
  ),
);

DeleteButton.displayName = "DeleteButton";

export default DeleteButton;
