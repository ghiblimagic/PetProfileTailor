"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

import { useRef, useEffect, useState } from "react";

import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import XSvgIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/XSvgIcon";
import StyledInput from "@components/FormComponents/StyledInput";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import TagsSelectAndCheatSheet from "@components/FormComponents/TagsSelectAndCheatSheet";
import { useTags } from "@hooks/useTags";
import { useCategoriesForDataType } from "@/hooks/useCategoriesForDataType";

export default function EditContent({
  dataType,
  open,
  onClose,
  content,
  onSave,
}) {
  const { categoriesWithTags, tagList } = useCategoriesForDataType(dataType);

  const initialTags = content.tags.map((tag) => ({
    label: tag.tag,
    value: tag._id,
  }));

  const { tagsToSubmit, handleSelectChange, handleCheckboxChange } =
    useTags(initialTags);

  const panelRef = useRef(null);

  const [updatedContent, setUpdatedContent] = useState(content.content);
  const [notes, setNotes] = useState(content.notes);
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (isSaving) return; // prevent double click
    setIsSaving(true);

    await onSave({
      content: updatedContent,
      notes: notes,
      tags: tagsToSubmit.map((t) => t.value),
    });

    setIsSaving(false);
  };

  const maxContentLength = dataType === "names" ? 50 : 2000;

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      // this way the form won't close when the user clicks on the backdrop
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      initialFocus={panelRef} // optional, for focusing panel for keyboard scroll
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden="true"
      />

      {/* Modal panel */}
      <DialogPanel
        className="relative bg-primary rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto p-6 z-50 text-center"
        onClick={(e) => e.stopPropagation()} // prevent clicks from closing
        tabIndex={0} // focusable for arrow key scrolling
      >
        {/* Close button */}
        <div className="flex justify-end">
          <XSvgIcon
            onClickAction={onClose}
            screenReaderText="Close"
          />
        </div>

        <DialogTitle className="text-lg font-bold text-subtleWhite mb-4">
          Edit Content
        </DialogTitle>

        {/* ############ CONTENT ################# */}
        <h4 className="text-subtleWhite mb-2 text-lg">
          {dataType === "names" ? "Name" : "Description"}
        </h4>

        {dataType === "names" && (
          <StyledInput
            value={updatedContent}
            onChange={(e) => setUpdatedContent(e.target.value.trimStart())}
            maxLength={maxContentLength}
          />
        )}
        {dataType === "descriptions" && (
          <StyledTextarea
            value={updatedContent}
            onChange={(e) => setUpdatedContent(e.target.value.trimStart())}
            maxLength={maxContentLength}
          />
        )}
        <span className="block text-subtleWhite mb-2">
          {`${
            maxContentLength - updatedContent.length
          }/ ${maxContentLength} characters left`}
        </span>

        {/* notes */}
        <h4 className="text-subtleWhite mb-2 text-lg">Notes</h4>
        <StyledTextarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.trimStart())}
          maxLength={1000}
        />
        <span className="block text-subtleWhite mb-2">
          {`${1000 - notes.length}/1000 characters left`}
        </span>

        {/* Tags */}
        <TagsSelectAndCheatSheet
          dataType={dataType}
          tagsToSubmit={tagsToSubmit}
          handleSelectChange={handleSelectChange}
          handleCheckboxChange={handleCheckboxChange}
        />

        {/* Buttons */}
        <div className="mt-6 flex justify-evenly px-8">
          <GeneralButton
            text="Cancel"
            secondary
            onClick={onClose}
            className="w-44"
          />
          <GeneralButton
            text="Save"
            subtle
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-44"
          />
        </div>
      </DialogPanel>
    </Dialog>
  );
}
