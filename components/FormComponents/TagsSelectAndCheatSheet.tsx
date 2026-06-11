/**
 * Multi-select tags picker with category cheat-sheet panel.
 * Notes: docs/notes/components/tags-select-and-cheat-sheet.md
 */
"use client";

import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import Select, { type StylesConfig } from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";
import { useCategoriesForDataType } from "@/hooks/useCategoriesForDataType";
import GeneralButton from "../ReusableSmallComponents/buttons/GeneralButton";
import type { TagOption, TagCheckboxChange } from "@/hooks/useTags";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

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
    (tag) => tagList.find((option) => option.value === tag.value) || tag,
  );

  const customSelectStyles: StylesConfig<TagOption, true> = {
    control: (provided) => ({
      ...provided,
      backgroundColor: isDisabled
        ? "var(--select-bg-disabled)"
        : "var(--select-bg-primary)",
      pointerEvents: isDisabled ? "auto" : "auto",
      borderColor: "var(--select-border)",
      color: "var(--select-text)",
      width: "96%",
      borderRadius: "10px",
      marginTop: "1rem",
      paddingTop: "1rem",
      paddingBottom: "1rem",
      paddingLeft: "0.5rem",
      margin: "1rem auto",
      minHeight: "2.5rem",
      boxShadow: "none",
      "&:hover": {
        borderColor: "rgb(221 214 254)",
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
      borderRadius: "0.5rem",
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
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "var(--select-bg-secondary)",
      color: "var(--select-text)",
      borderRadius: "20px",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "var(--select-text)",
      whiteSpace: "normal",
      wordBreak: "break-word",
      overflowWrap: "break-word",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "rgb(221 214 254)",
      ":hover": {
        backgroundColor: "#2563EB",
        color: "white",
        borderRadius: "10px",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--select-text)",
    }),
  };

  return (
    <div className="h-fit w-full bg-secondary border-b-2 border-subtleWhite rounded-box py-2 mx-auto">
      <Select<TagOption, true>
        instanceId={`tags-select-${dataType}`}
        styles={customSelectStyles}
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

      <p className="my-4 text-subtleWhite text-center">
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
        <div className="flex flex-wrap justify-center">
          {categoriesWithTags.map((category) => (
            <Disclosure
              key={category._id}
              as="div"
              className="inline-block align-top mb-6 text-center "
            >
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-[306px]  bg-primary px-2 py-2 text-base font-medium text-subtleWhite hover:bg-blue-700 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                    <span className="mx-auto">{category.category}</span>
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 transform" : ""
                      } h-5 w-5 bg-blue-00`}
                    />
                  </Disclosure.Button>

                  <Disclosure.Panel
                    className={`px-4 pt-4 pb-2 text-sm text-subtleWhite  bg-primary  w-[306px] ${
                      isDisabled &&
                      "bg-errorBackgroundColor [&_*]:cursor-not-allowed"
                    }`}
                  >
                    <div className={`space-y-6 mb-4y `}>
                      {category.tags.map((tag) => {
                        const checked = tagsToSubmit.some(
                          (t) => t.value === tag._id,
                        );
                        return (
                          <label
                            key={tag._id}
                            htmlFor={tag._id}
                            className={`flex items-center space-x-2 cursor-pointer group hover:bg-blue-700 px-1 py-1 rounded  `}
                          >
                            <input
                              id={tag._id}
                              type="checkbox"
                              className="peer fixed top-0 left-0  m-0 h-[1px] w-[1px] overflow-hidden whitespace-nowrap border-0 p-0"
                              style={{
                                clip: "rect(0 0 0 0)",
                                clipPath: "inset(50%)",
                              }}
                              disabled={isDisabled}
                              checked={checked}
                              onChange={(e) =>
                                handleCheckboxChange({
                                  id: tag._id,
                                  label: tag.tag,
                                  checked: e.target.checked,
                                })
                              }
                            />

                            <span
                              className={`
      border-2 border-violet-300 rounded flex items-center justify-center p-[7px]
      transition-colors duration-200
      bg-secondary text-subtleWhite group
      peer-checked:bg-yellow-300 peer-checked:text-secondary group-hover:bg-blue-700
      peer-focus:ring-2 peer-focus:ring-yellow-400 peer-focus:outline-none ${
        isDisabled && "bg-errorBackgroundColor cursor-not-allowed"
      }
    `}
                            >
                              <FontAwesomeIcon icon={faPaw} />
                            </span>

                            <span className={`text-subtleWhite text-left`}>
                              {tag.tag}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      )}
    </div>
  );
}
