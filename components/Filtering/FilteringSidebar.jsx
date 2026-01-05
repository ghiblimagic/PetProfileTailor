"use client";

import { useState, useRef } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import { ButtonGroup } from "@mui/material";
import StyledCheckbox from "@components/FormComponents/StyledCheckbox";
import ClosingXButton from "@components/ReusableSmallComponents/buttons/ClosingXButton";
import { useCategAndTags } from "@/context/CategoriesAndTagsContext";
import { useCategoriesForDataType } from "@/hooks/useCategoriesForDataType";

function FilteringSidebar({
  dataType,
  handleFilterChange,
  handleApplyFilters,
  filterTagsIds,
  setFilterTagsIds,
  toggleDrawer,
  isLoading,
  remainingFilterCooldown,
  startCooldown,
}) {
  const { categoriesWithTags, tags } = useCategoriesForDataType(dataType);

  const applyQuickFilter = (tagIds) => {
    if (remainingFilterCooldown > 0 || isLoading) return;

    setFilterTagsIds(tagIds);
    handleApplyFilters(false, tagIds);
    toggleDrawer(false);
  };

  const onApplyClick = () => {
    if (remainingFilterCooldown > 0 || isLoading) return;

    handleApplyFilters();
    toggleDrawer(false);
  };

  return (
    <div className="flex flex-col  bg-primary sm:w-96 min-h-screen">
      <div className="flex justify-between text-xl items-center border-b border-white">
        <h4 className="text-subtleWhite text-center pl-4 "> Filters </h4>
        <ClosingXButton
          onClick={() => toggleDrawer(false)}
          className="mr-5 shadow-none"
        />
      </div>
      {/* scrollable content */}
      {/* **************** Quick filters  **************** */}
      {dataType === "names" && (
        <div className="px-4 py-3 border-b border-white">
          <p className="text-subtleWhite text-lg mb-2">Quick filters</p>

          {remainingFilterCooldown > 0 && (
            <span className="text-subtleWhite">
              {" "}
              Wait {remainingFilterCooldown}s
            </span>
          )}

          <div className="flex flex-wrap gap-x-4">
            <GeneralButton
              text="Common Pet Names"
              subtle
              disabled={remainingFilterCooldown > 0 || isLoading}
              onClick={() => applyQuickFilter(["68ef04450f2c50aed0721f5a"])}
            />

            <GeneralButton
              text="Human Names"
              subtle
              disabled={remainingFilterCooldown > 0 || isLoading}
              onClick={() => applyQuickFilter(["68e037d103ba0c640c8bc35a"])}
            />

            <GeneralButton
              text="Cutesy"
              subtle
              disabled={remainingFilterCooldown > 0 || isLoading}
              onClick={() => applyQuickFilter(["6401efe2d9f774e804cb359f"])}
            />
            <GeneralButton
              text="Spicy, Sassy"
              subtle
              disabled={remainingFilterCooldown > 0 || isLoading}
              onClick={() => applyQuickFilter(["641cc403d235cbd605de96bb"])}
            />
            <GeneralButton
              text="Friendly, Sweet"
              subtle
              disabled={remainingFilterCooldown > 0 || isLoading}
              onClick={() => applyQuickFilter(["6401ef92d9f774e804cb3578"])}
            />
          </div>
        </div>
      )}
      {/* **************** Normal filters  **************** */}
      <div className="  overflow-y-auto bg-primary px-2">
        {/* mapping through categories ex: gender, holidays */}
        {categoriesWithTags.map((category, index) => {
          return (
            <Disclosure key={category._id}>
              {/* defaultOpen will have the disclosure stay open*/}
              {({ open }) => (
                <>
                  {/* Category Name shows here ("species", "food") */}
                  <DisclosureButton
                    className="flex w-full justify-between bg-primary px-2 py-2 text-left text-base font-medium text-subtleWhite
                 hover:text-slate-400   focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75 "
                  >
                    <div>
                      <span>{category.category} </span>
                      <span className="block flex-none text-sm text-slate-300">
                        {" "}
                        {category.tags
                          .filter((tag) => filterTagsIds.includes(tag._id))
                          .map((tag) => tag.tag)
                          .join(", ")}
                      </span>
                    </div>
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 transform" : ""
                      } h-5 w-5 mr-3 text-subtleWhite`}
                    />
                  </DisclosureButton>

                  <DisclosurePanel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                    <div className="space-y-6 ">
                      {/* mapping through category options and assigning them a button (ex: male, female, unisex)*/}

                      {category.tags.map((option, index) => (
                        <StyledCheckbox
                          key={option._id}
                          id={`filter-mobile-${index}`} // unique id for accessibility
                          label={option.tag} // visible text
                          value={option._id}
                          checked={filterTagsIds.includes(option._id)}
                          onChange={handleFilterChange}
                          className="group px-2" // optional styling wrapper
                        />
                        // <div
                        //   key={option._id}
                        //   className="flex items-center group px-2"
                        // >
                        //   {/* adds a checkbox*/}
                        //   <input
                        //     id={`filter-mobile-${index}`}
                        //     name={`${option.tag}[]`}
                        //     value={option._id}
                        //     type="checkbox"
                        //     onChange={handleFilterChange}
                        //     className="h-4 w-4 rounded border-violet-300 text-amber-300 focus:ring-amber-600  group-hover:bg-subtleWhite bg-secondary"
                        //     checked={filterTagsIds.includes(option._id)}
                        //   />

                        // </div>
                      ))}
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          );
        })}
      </div>
      <div className="flex justify-evenly p-4 border-t border-white bg-primary">
        <GeneralButton
          text="reset"
          active
          className="text-center bg-subtleWhite"
          onClick={() => {
            handleApplyFilters("reset");
            toggleDrawer(false);
          }}
          disabled={isLoading}
        />
        <GeneralButton
          text={
            remainingFilterCooldown
              ? `wait ${remainingFilterCooldown} secs`
              : "apply"
          }
          className="text-center"
          onClick={() => onApplyClick()}
          disabled={isLoading || remainingFilterCooldown}
        />
      </div>
    </div>
  );
}

export default FilteringSidebar;
