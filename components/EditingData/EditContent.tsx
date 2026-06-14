/**
 * Edit dialog for listing name/description rows.
 * Notes: docs/notes/hooks/useEditHandler.md
 */
"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useRef, useState } from "react";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import XSvgIcon from "@components/Shared/icons/XSvgIcon";
import StyledInput from "@components/FormComponents/StyledInput";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import TagsSelectAndCheatSheet from "@components/FormComponents/TagsSelectAndCheatSheet";
import { useTags } from "@hooks/useTags";
import type { ContentType } from "@/utils/api/checkIfValidContentType";
import type { EditSubmission } from "@/hooks/useEditHandler";

type ContentTag = { tag: string; _id: string };

export type EditableContent = {
  content: string;
  notes?: string;
  tags: ContentTag[];
};

export type EditContentProps = {
  dataType: ContentType | string;
  open: boolean;
  onClose: () => void;
  content: EditableContent;
  onSave: (editedData: EditSubmission) => void | Promise<void>;
};

export default function EditContent({
  dataType,
  open,
  onClose,
  content,
  onSave,
}: EditContentProps) {
  const initialTags = content.tags.map((tag) => ({
    label: tag.tag,
    value: tag._id,
  }));

  const { tagsToSubmit, handleSelectChange, handleCheckboxChange } =
    useTags(initialTags);

  const panelRef = useRef<HTMLDivElement>(null);

  const [updatedContent, setUpdatedContent] = useState(content.content);
  const [notes, setNotes] = useState(content.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);

    await onSave({
      content: updatedContent,
      notes,
      tags: tagsToSubmit.map((t) => t.value),
    });

    setIsSaving(false);
  };

  const maxContentLength = dataType === "names" ? 50 : 2000;

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      initialFocus={panelRef}
    >
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden="true"
      />

      <DialogPanel
        ref={panelRef}
        className="relative bg-primary rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto p-6 z-50 text-center"
        onClick={(e) => e.stopPropagation()}
        tabIndex={0}
      >
        <div className="flex justify-end">
          <XSvgIcon
            onClickAction={onClose}
            screenReaderText="Close"
          />
        </div>

        <DialogTitle className="text-lg font-bold text-subtleWhite mb-4">
          Edit Content
        </DialogTitle>

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
          {`${maxContentLength - updatedContent.length}/ ${maxContentLength} characters left`}
        </span>

        <h4 className="text-subtleWhite mb-2 text-lg">Notes</h4>
        <StyledTextarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.trimStart())}
          maxLength={1000}
        />
        <span className="block text-subtleWhite mb-2">
          {`${1000 - notes.length}/1000 characters left`}
        </span>

        <TagsSelectAndCheatSheet
          dataType={dataType}
          tagsToSubmit={tagsToSubmit}
          handleSelectChange={handleSelectChange}
          handleCheckboxChange={handleCheckboxChange}
          isDisabled={false}
        />

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
