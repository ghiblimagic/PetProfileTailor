import React from "react";
import { Field } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";

export default function StyledCheckbox({
  label,
  description,
  checked = false,
  onChange,
  value,
  className = "",
  disabled = false,
}) {
  // id={`filter-mobile-${index}`} wasn't working, htmlFor={id} and <input id={id} kept breaking
  // why?
  // Once a panel opens, closes, or React remounts, index-based ids break uniqueness across multiple panels
  //`filter-mobile-${0} would of been shared by multiple boxes that were open
  // this fixed the “mouse click stuck/focus jumping” bug because the first focusable element Headless UI sees is actually the right one, and it doesn’t collide with duplicates or indices that might have changed.
  // value works because this will always be globally unique
  return (
    <label
      htmlFor={value}
      className="flex items-start space-x-2 cursor-pointer max-w-96"
    >
      <input
        id={value}
        value={value} // important so your handler sees it
        type="checkbox"
        checked={checked}
        onChange={onChange}
        //  Don't use sr-only here — Chrome mobile scroll bug
        // Instead, physically remove from layout but keep focusable and accessible
        // but "peer absolute left-[-9999px] top-auto w-px h-px overflow-hidden" was leading to double vertical scrollbars

        // solution: "peer absolute m-0 h-[1px] w-[1px] overflow-hidden whitespace-nowrap border-0 p-0"
        // clip + clip-path combo makes it truly invisible.
        // This is the same underlying technique used by modern screen-reader-only utilities like sr-only, but avoids the position: absolute; left: 0 that can misbehave in specific mobile browsers

        className="peer fixed top-0 left-0  m-0 h-[1px] w-[1px] overflow-hidden whitespace-nowrap border-0 p-0"
        style={{ clip: "rect(0 0 0 0)", clipPath: "inset(50%)" }}
        disabled={disabled}
      />

      <span
        className={`
          border-2 border-violet-300 rounded flex items-center justify-center p-[7px]
          transition-colors duration-200
          bg-secondary text-subtleWhite
          peer-checked:bg-yellow-300 peer-checked:text-secondary
          peer-focus:ring-2 peer-focus:ring-yellow-400 peer-focus:outline-none ${
            disabled && "cursor-not-allowed"
          }
        `}
      >
        <FontAwesomeIcon icon={faPaw} />
      </span>

      <div className="flex flex-col text-left min-w-0  break-words">
        {label && <span className="text-subtleWhite font-bold">{label}</span>}
        {description && (
          <span className="text-subtleWhite text-sm">{description}</span>
        )}
      </div>
    </label>
  );
}
