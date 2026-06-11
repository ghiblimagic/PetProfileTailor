/**
 * Themed textarea for add/edit forms.
 * Notes: docs/notes/components/form-components.md
 */
import { type ChangeEventHandler } from "react";

export type StyledTextareaProps = {
  className?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  required?: boolean;
  maxLength?: number;
  value?: string;
  ariaLabel?: string;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

export default function StyledTextarea({
  className,
  onChange,
  required,
  maxLength,
  value,
  ariaLabel,
  name,
  disabled = false,
  placeholder,
  id,
}: StyledTextareaProps) {
  return (
    <textarea
      id={id}
      className={`bg-primary border-subtleWhite  disabled:bg-errorBackgroundColor disabled:text-errorTextColor disabled:cursor-not-allowed text-subtleWhite block rounded-2xl h-32 min-w-[200px] w-[95%] sm:min-w-[400px] mx-auto ${className ?? ""}`}
      aria-label={ariaLabel}
      onChange={onChange}
      required={required}
      maxLength={maxLength}
      value={value}
      name={name}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
