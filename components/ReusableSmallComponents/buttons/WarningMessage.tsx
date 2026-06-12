/**
 * Red validation / submission banner with optional dismiss.
 * Notes: docs/notes/components/reusable-buttons.md
 */
import XSvgIcon from "../iconsOrSvgImages/XSvgIcon";
import type { Dispatch, SetStateAction } from "react";

export type WarningMessageProps = {
  message: string;
  state?: Dispatch<SetStateAction<string>>;
};

export default function WarningMessage({
  message,
  state,
}: WarningMessageProps) {
  return (
    <div className="relative">
      <p className="mt-4 bg-red-900 p-2 text-white font-bold border-2 border-subtleWhite block text-center mb-4">
        {message}
      </p>
      {state && (
        <XSvgIcon
          screenReaderText="Close message"
          onClickAction={() => state("")}
        />
      )}
    </div>
  );
}
