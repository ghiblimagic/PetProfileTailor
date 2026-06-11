/**
 * react-hook-form input with label, helper text, and error line.
 * Notes: docs/notes/components/form-components.md
 */
import React, { type ReactElement, type ReactNode } from "react";
import type {
  FieldError,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";

type HelperElement = ReactElement<{ className?: string }>;

export type RegisterInputProps<T extends FieldValues = FieldValues> = {
  id: string;
  label?: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  register: UseFormRegister<T>;
  validation?: RegisterOptions<T>;
  error?: FieldError;
  inputStyling?: string;
  labelStyling?: string;
  labelToSide?: boolean;
  helperText?: ReactNode | ReactNode[];
  disabled?: boolean;
  className?: string;
};

// import React necessary because of React.cloneElement

export default function RegisterInput<T extends FieldValues = FieldValues>({
  id,
  label,
  type = "text",
  placeholder,
  maxLength,
  autoFocus,
  register,
  validation,
  error,
  inputStyling = "",
  labelStyling = "",
  labelToSide = false,
  helperText,
  disabled,
  className = "",
}: RegisterInputProps<T>) {
  return (
    <div className={`mb-4 ${labelToSide && "flex"}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block mb-1 font-medium text-subtleWhite ${labelStyling}`}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`border rounded-2xl bg-secondary text-subtleWhite border-violet-200 p-2 mb-2 outline-none placeholder-secondary min-w-[250px] w-[95vw] sm:min-w-[400px] sm:w-full ${inputStyling} ${className}`}
        {...register(id as Path<T>, validation)}
      />
      {/* helper text if provided */}
      {helperText &&
        (Array.isArray(helperText) ? (
          //case 1 if its an array
          helperText.map((item, idx) =>
            // case 1.a If the element is a string => wrap it in <p>
            typeof item === "string" ? (
              <p
                key={idx}
                className="text-sm text-gray-300 mt-1"
              >
                {item}
              </p>
            ) : (
              // case 1.b
              // If element is JSX (like <p><strong>…</strong></p>)
              //  keep it as-is but add the standard helper classes via React.cloneElement
              React.cloneElement(item as HelperElement, {
                key: idx,
                className: `text-sm text-gray-300 mt-1 ${
                  (item as HelperElement).props.className || ""
                }`,
              })
            ),
          )
        ) : // case 2 if its not an array
        typeof helperText === "string" ? (
          // case 2.1 if its a string render it as a p
          <p className="text-sm text-gray-300 mt-1">{helperText}</p>
        ) : (
          // case 2.2 otherwise its JSX so render it as JSX with helper classes
          React.cloneElement(helperText as HelperElement, {
            className: `text-sm text-gray-300 mt-1 ${
              (helperText as HelperElement).props.className || ""
            }`,
          })
        ))}
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
