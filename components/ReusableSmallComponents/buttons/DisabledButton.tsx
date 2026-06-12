/**
 * Non-interactive submit button for invalid form state.
 * Notes: docs/notes/components/reusable-buttons.md
 */
export type DisabledButtonProps = {
  text: string;
  className?: string;
};

export default function DisabledButton({
  text,
  className,
}: DisabledButtonProps) {
  return (
    <button
      className={`mx-auto         
             disabled:bg-errorBackgroundColor disabled:text-errorTextColor disabled:border-errorBorderColor
             font-bold py-2 px-4 border-b-4
             cursor-default  ${className}`}
      type="submit"
      disabled
    >
      {text}
    </button>
  );
}
