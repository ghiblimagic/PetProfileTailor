import { forwardRef } from "react";
import type { MouseEvent } from "react";
import { Pencil } from "lucide-react";

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
      <Pencil size={16} className="mr-2" />
      <span>Edit</span>
    </button>
  ),
);

EditButton.displayName = "EditButton";

export default EditButton;
