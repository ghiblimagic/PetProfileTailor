import type { ReactElement, ReactNode } from "react";
import type {
  FieldError,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";

export type RegisterInputProps<T extends FieldValues = FieldValues> = {
  id: Path<T> | string;
  label?: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  className?: string;
  register: UseFormRegister<T>;
  validation?: RegisterOptions<T>;
  error?: FieldError;
  inputStyling?: string;
  labelStyling?: string;
  labelToSide?: boolean;
  helperText?: ReactNode | ReactNode[];
  disabled?: boolean;
};

declare function RegisterInput<T extends FieldValues = FieldValues>(
  props: RegisterInputProps<T>,
): ReactElement;

export default RegisterInput;
