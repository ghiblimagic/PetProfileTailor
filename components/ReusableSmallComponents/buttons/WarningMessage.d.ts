import type { Dispatch, ReactElement, SetStateAction } from "react";

export type WarningMessageProps = {
  message: string;
  state?: Dispatch<SetStateAction<string>>;
};

declare function WarningMessage(props: WarningMessageProps): ReactElement;

export default WarningMessage;
