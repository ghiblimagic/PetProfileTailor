"use client";

import type { Dispatch, SetStateAction } from "react";
import GeneralButton from "@components/shared/actions/GeneralButton";

export type ToggeableAlertProps<T extends boolean | string = boolean | string> =
  {
    text: string;
    toggleState: T;
    setToggleState: Dispatch<SetStateAction<T>>;
  };

export default function ToggeableAlert<T extends boolean | string>({
  text,
  setToggleState,
  toggleState,
}: ToggeableAlertProps<T>) {
  return (
    <div className="p-4 bg-red-900 text-subtleWhite text-center rounded-2xl mb-2 max-w-[90%] mx-auto border-2 border-yellow-200">
      <p className="self-center">{text}</p>

      <GeneralButton
        text="Close"
        className="mx-auto"
        onClick={() =>
          setToggleState(
            (typeof toggleState === "boolean" ? false : "") as T,
          )
        }
      />
    </div>
  );
}
