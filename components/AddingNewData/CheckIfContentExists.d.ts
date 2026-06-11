import type { Dispatch, ReactElement, SetStateAction } from "react";

export type CheckIfContentExistsProps = {
  apiString: string;
  disabled?: boolean;
  contentType: string;
  resetTrigger?: boolean;
  showFullContent?: boolean;
  addNamesPage?: boolean;
  value?: string;
  onChange?: Dispatch<SetStateAction<string>>;
  invalidInput?: string[] | null;
  checkIsProcessing?: boolean;
  setCheckIsProcessing?: Dispatch<SetStateAction<boolean>>;
};

declare function CheckIfContentExists(
  props: CheckIfContentExistsProps,
): ReactElement;

export default CheckIfContentExists;
