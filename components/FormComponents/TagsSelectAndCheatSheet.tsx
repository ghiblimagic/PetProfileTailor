/**
 * Multi-select tags picker with category cheat-sheet panel.
 * Notes: docs/notes/components/tags-select-and-cheat-sheet.md
 */
"use client";

import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import { Fragment, useState, type ComponentPropsWithoutRef } from "react";
import Select, { type StylesConfig, type MultiValueProps } from "react-select";
import { useCategoriesForDataType } from "@/hooks/useCategoriesForDataType";
import GeneralButton from "../Shared/actions/GeneralButton";
import StyledCheckbox from "./StyledCheckbox";
import { tagPillClassName } from "@components/Shared/typography/TagPill";
import type { TagOption, TagCheckboxChange } from "@/hooks/useTags";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

// Renders a selected tag exactly like TagPill (ContentListing.tsx,
// addingdescription.tsx's tag preview) — "#tag" pills sitewide — rather
// than react-select's own boxy default chip. Replaces the whole MultiValue
// (not just Container/Label) so react-select's own CSS-in-JS styling for
// those sub-parts (previously set via `multiValue`/`multiValueLabel`/
// `multiValueRemove` in `customSelectStyles` below) never gets a chance to
// compete with these Tailwind classes.
//
// Note: unlike Container/Label/Remove, the top-level MultiValue element
// react-select itself renders is NOT given an `innerProps` (see
// `renderPlaceholderOrValue` in react-select's Select.js — it only passes
// `data`/`removeProps`/`isDisabled`/etc.; `innerProps` is something the
// *default* MultiValue component computes internally for its own
// Container, which we're replacing). The `.d.ts` types it as required
// anyway, but it's actually `undefined` here — destructuring/spreading it
// throws at runtime, so it's intentionally left out below.
function TagPillMultiValue({
  data,
  removeProps,
  isDisabled,
}: MultiValueProps<TagOption, true>) {
  return (
    <span
      className={`${tagPillClassName} inline-flex items-center gap-1.5 my-0.5`}
    >
      #{data.label}
      {!isDisabled && (
        <button
          type="button"
          // react-select types removeProps as div props purely because its
          // own default Remove sub-component renders a div — at runtime
          // it's just { onClick, onTouchEnd, onMouseDown } (see
          // react-select's Select.js), so it's safe to spread onto a
          // <button> instead.
          {...(removeProps as ComponentPropsWithoutRef<"button">)}
          aria-label={`Remove ${data.label}`}
          className="shrink-0 rounded-full px-1 leading-none hover:bg-white/20"
        >
          &times;
        </button>
      )}
    </span>
  );
}

export type TagsSelectAndCheatSheetProps = {
  dataType: ContentType | string;
  tagsToSubmit: TagOption[];
  handleSelectChange: (selected: TagOption[]) => void;
  handleCheckboxChange: (args: TagCheckboxChange) => void;
  isDisabled?: boolean;
};

export default function TagsSelectAndCheatSheet({
  dataType,
  tagsToSubmit,
  handleSelectChange,
  handleCheckboxChange,
  isDisabled = false,
}: TagsSelectAndCheatSheetProps) {
  const { categoriesWithTags, tagList } = useCategoriesForDataType(dataType);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptions = tagsToSubmit.map(
    (tag) => tagList.find((option) => option.value === tag.value) || tag
  );

  const customSelectStyles: StylesConfig<TagOption, true> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: isDisabled
        ? "var(--select-bg-disabled)"
        : "var(--field-background)",
      pointerEvents: isDisabled ? "auto" : "auto",
      borderColor: state.isFocused ? "#2563EB" : "var(--subtle-border)",
      color: "var(--select-text)",
      width: "96%",
      borderRadius: "10px",
      marginTop: "1rem",
      paddingTop: "1rem",
      paddingBottom: "1rem",
      paddingLeft: "0.5rem",
      margin: "1rem auto",
      minHeight: "2.5rem",
      boxShadow: state.isFocused ? "0 0 0 1px #2563EB" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#2563EB" : "rgb(221 214 254)",
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "var(--select-text)",
      cursor: isDisabled ? "not-allowed" : "pointer",
      backgroundColor: "transparent",
      "&:hover": {
        backgroundColor: "var(--select-hover)",
        color: "var(--select-text)",
      },
    }),
    clearIndicator: (provided) => ({
      cursor: isDisabled ? "not-allowed" : "pointer",
      ...provided,
      color: "var(--select-text)",
      backgroundColor: "transparent",
      "&:hover": {
        backgroundColor: "var(--select-hover)",
        color: "var(--select-text)",
      },
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      boxShadow: "none",
      outline: "none",
      cursor: isDisabled ? "not-allowed" : "pointer",
      background: "transparent",
      caretColor: "var(--select-text)",
      color: "var(--select-text)",
      lineHeight: "1.2",
      minWidth: "1px",
      width: "auto",
      flex: "0 0 auto",
    }),
    valueContainer: (provided) => ({
      ...provided,
      display: "flex",
      cursor: isDisabled ? "not-allowed" : "pointer",
      flexWrap: "wrap",
      gap: "0.25rem",
      overflow: "hidden",
      wordBreak: "break-word",
      alignItems: "center",
      paddingLeft: "0.25rem",
      paddingRight: "0.25rem",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "var(--select-bg-primary)",
      color: "var(--select-text)",
      border: "1px solid var(--subtle-border)",
      borderRadius: "0.7rem",
    }),
    menuList: (provided) => ({
      ...provided,
      paddingLeft: "0.5rem",
      paddingBottom: "0.5rem",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "var(--select-hover)"
        : "var(--select-bg-primary)",
      color: "var(--select-text)",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      paddingTop: "0.25rem",
      paddingBottom: "0.25rem",
      borderRadius: "9999px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--select-text)",
    }),
  };

  return (
    <div className="h-fit w-full rounded-box py-2 mx-auto">
      <Select<TagOption, true>
        instanceId={`tags-select-${dataType}`}
        styles={customSelectStyles}
        components={{ MultiValue: TagPillMultiValue }}
        options={tagList}
        value={selectedOptions}
        isMulti
        isSearchable
        isDisabled={isDisabled}
        filterOption={(option, inputValue) =>
          option.label.toLowerCase().includes(inputValue.toLowerCase())
        }
        onChange={(selected) => handleSelectChange([...selected])}
      />

      <p className="my-4 text-secondaryText text-center">
        Or use the tags cheat sheet
      </p>
      <div className="flex justify-center mb-4">
        <GeneralButton
          text={`${isOpen ? "Close" : "Open"}`}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          subtle
        />
      </div>
      {isOpen && (
        <div className="justify-center rounded-box border border-buttonAccent   overflow-hidden">
          {categoriesWithTags.map((category, index) => (
            <Fragment key={category._id}>
              {index > 0 && (
                <hr className="mx-6" />
              )}
              <Disclosure as="div" className="block w-full text-center ">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full  bg-primary px-6 py-3 text-base font-medium text-subtleWhite hover:bg-blue-700 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                      <span className="mx-auto">{category.category}</span>
                      <ChevronUpIcon
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 bg-blue-00`}
                      />
                    </Disclosure.Button>

                    <Disclosure.Panel
                      className={`px-4 pt-6 pb-6 text-sm text-subtleWhite  bg-primary  w-full ${
                        isDisabled &&
                        "bg-errorBackgroundColor [&_*]:cursor-not-allowed"
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {category.tags.map((tag) => {
                          const checked = tagsToSubmit.some(
                            (t) => t.value === tag._id
                          );
                          return (
                            <StyledCheckbox
                              key={tag._id}
                              value={tag._id}
                              label={tag.tag}
                              labelClassName="text-left"
                              checked={checked}
                              disabled={isDisabled}
                              onChange={(e) =>
                                handleCheckboxChange({
                                  id: tag._id,
                                  label: tag.tag,
                                  checked: e.target.checked,
                                })
                              }
                              className="group hover:bg-blue-700 px-1 py-1 rounded"
                              boxClassName={`group-hover:bg-blue-700 ${
                                isDisabled ? "bg-errorBackgroundColor" : ""
                              }`}
                            />
                          );
                        })}
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
