/**
 * Plain GeneralButton preset for modal/panel close.
 * Notes: docs/notes/components/reusable-buttons.md
 */
import GeneralButton from "./GeneralButton";
import type { GeneralButtonProps } from "./GeneralButton";

export type ClosingXButtonProps = {
  onClick?: GeneralButtonProps["onClick"];
  className?: string;
};

export default function ClosingXButton({
  onClick,
  className,
}: ClosingXButtonProps) {
  return (
    <GeneralButton
      type="button"
      text="X"
      className={className}
      plain
      onClick={onClick}
    />
  );
}
