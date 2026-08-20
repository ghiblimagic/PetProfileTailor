import { forwardRef } from "react";
import type { MouseEvent } from "react";
import { Trash2 } from "lucide-react";

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
      <Trash2 size={16} className="mr-2" />
      <span> Delete</span>
    </button>
  ),
);

DeleteButton.displayName = "DeleteButton";

export default DeleteButton;
