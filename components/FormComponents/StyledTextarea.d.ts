import type { ReactElement, TextareaHTMLAttributes } from "react";

export type StyledTextareaProps = {
  className?: string;
  onChange?: TextareaHTMLAttributes<HTMLTextAreaElement>["onChange"];
  required?: boolean;
  maxLength?: number;
  value?: string;
  ariaLabel?: string;
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

declare function StyledTextarea(props: StyledTextareaProps): ReactElement;

export default StyledTextarea;
