/**
 * Label + themed text input.
 * Notes: docs/notes/components/form-components.md
 */
import { type ChangeEventHandler, type ReactNode } from "react";

export type StyledInputProps = {
  className?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  value?: string;
  maxLength?: number;
  type?: string;
  id?: string;
  name?: string;
  label?: ReactNode;
  required?: boolean;
  placeholder?: string;
};

export default function StyledInput({
  className,
  onChange,
  value,
  maxLength,
  type,
  id,
  name,
  label,
  required,
  placeholder,
}: StyledInputProps) {
  return (
    <>
      {label && (
        <label
          className="font-bold block mt-4 text-subtleWhite"
          htmlFor={id}
        >
          {label}
        </label>
      )}

      <input
        className={`border bg-primary rounded-2xl text-subtleWhite border-violet-200 p-2 mb-4 outline-none splaceholder-secondary ${className ?? ""}`}
        onChange={onChange}
        value={value}
        maxLength={maxLength}
        type={type}
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
      />
    </>
  );
}
