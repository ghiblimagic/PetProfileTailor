/**
 * Edit dialog state + PUT submission for listing rows.
 * Notes: docs/notes/hooks/useEditHandler.md
 */
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

type ListingContent = { _id: string };

type EditSubmission = {
  content: string;
  notes: string;
  tags: string[];
};

type SwrPage = { data: ListingContent[] };

export function useEditHandler({
  apiEndpoint,
  mutate,
  setLocalData,
}: {
  apiEndpoint: string;
  mutate?: (
    updater: (pages?: SwrPage[]) => SwrPage[],
    shouldRevalidate?: boolean,
  ) => void;
  setLocalData: (item: ListingContent) => void;
}) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<ListingContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = (content: ListingContent) => {
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
      const res = await axios.put<{ data?: ListingContent }>(apiEndpoint, {
        submission: {
          ...editedData,
          contentId: editTarget._id,
        },
      });

      const updatedItem: ListingContent =
        res.data?.data ??
        (res.data as ListingContent) ??
        { ...editTarget, ...editedData };

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
