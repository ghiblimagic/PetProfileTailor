/**
 * Edit dialog state + PUT submission for listing rows.
 * Notes: docs/notes/hooks/useEditHandler.md
 */
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export type EditSubmission = {
  content: string;
  notes: string;
  tags: string[];
};

type SwrPage<T extends { _id: string }> = { data: T[]; totalDocs?: number };

export function useEditHandler<T extends { _id: string }>({
  apiEndpoint,
  mutate,
  setLocalData,
}: {
  apiEndpoint: string;
  mutate?: (
    updater?: (pages?: SwrPage<T>[]) => SwrPage<T>[],
    shouldRevalidate?: boolean,
  ) => void;
  setLocalData: (item: T) => void;
}) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = (content: T) => {
    if (!content._id) {
      console.warn("openEdit called with invalid target!", content);
      return;
    }
    setEditTarget(content);
    setShowEditDialog(true);
  };

  const closeEdit = () => {
    setShowEditDialog(false);
    setEditTarget(null);
    setIsSaving(false);
  };

  const confirmEdit = async (editedData: EditSubmission) => {
    if (!editTarget) return;

    setIsSaving(true);

    try {
      const res = await axios.put<{ data?: T }>(apiEndpoint, {
        submission: {
          ...editedData,
          contentId: editTarget._id,
        },
      });

      const updatedItem: T =
        res.data?.data ??
        (res.data as T) ??
        ({ ...editTarget, ...editedData } as T);

      if (mutate) {
        mutate(
          (pages = []) =>
            pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item._id === updatedItem._id ? updatedItem : item,
              ),
            })),
          false,
        );
      }

      setLocalData(updatedItem);
      setEditTarget(updatedItem);

      toast.success("Successfully edited!");
      closeEdit();
    } catch (error) {
      console.error("Error editing content:", error);
      toast.error("Failed to edit content!");
      setIsSaving(false);
    }
  };

  return {
    showEditDialog,
    editTarget,
    isSaving,
    openEdit,
    closeEdit,
    confirmEdit,
  };
}
