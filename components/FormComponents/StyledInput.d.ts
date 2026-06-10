import type { InputHTMLAttributes, ReactElement } from "react";

export type StyledInputProps = {
  className?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  value?: string;
  maxLength?: number;
  type?: string;
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
};

declare function StyledInput(props: StyledInputProps): ReactElement;

export default StyledInput;
