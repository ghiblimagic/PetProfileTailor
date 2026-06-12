/**
 * Delete confirmation dialog state + optimistic delete for list or standalone rows.
 * Notes: docs/notes/hooks/useDeleteConfirmation.md
 */
import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";

export type DeleteTarget = {
  _id: string;
  content?: string;
};

type SwrPageLike<T extends { _id: string }> = {
  data: T[];
  totalDocs?: number;
};

type SwrMutate<T extends { _id: string } = { _id: string }> = (
  updater?: (pages?: SwrPageLike<T>[]) => SwrPageLike<T>[],
  shouldRevalidate?: boolean,
) => void;

export function useDeleteConfirmation() {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  function openDelete(target: DeleteTarget) {
    setDeleteTarget(target);
    setShowDeleteConfirmation(true);
  }

  function closeDelete() {
    setDeleteTarget(null);
    setShowDeleteConfirmation(false);
  }

  async function confirmDelete<T extends { _id: string }>(
    apiLink: string,
    signedInUsersId: string,
    customMutate?: SwrMutate<T>,
    setLocalData?: Dispatch<SetStateAction<T>>,
  ) {
    if (!deleteTarget) return;

    try {
      if (setLocalData) {
        setLocalData((prev) => {
          if (!prev) return prev;
          if (prev._id === deleteTarget._id) {
            return { ...prev, content: "DELETED" };
          }
          return prev;
        });
      }

      if (customMutate) {
        customMutate(
          (pages = []) =>
            pages.map((page) => ({
              ...page,
              data: page.data.filter((item) => item._id !== deleteTarget._id),
              totalDocs: (page.totalDocs ?? page.data.length) - 1,
            })),
          false,
        );
      }

      const res = await fetch(apiLink, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: deleteTarget._id,
          signedInUsersId,
        }),
      });
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);

      if (customMutate) customMutate();

      toast.success("Content deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);

      if (setLocalData) {
        setLocalData((prev) =>
          prev && prev._id === deleteTarget._id ? (deleteTarget as T) : prev,
        );
      }

      toast.error("Failed to delete content. Please try again.");
      if (customMutate) customMutate();
    } finally {
      closeDelete();
    }
  }

  return {
    showDeleteConfirmation,
    deleteTarget,
    openDelete,
    closeDelete,
    confirmDelete,
  };
}
