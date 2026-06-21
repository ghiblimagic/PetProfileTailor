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

export type SwrPageLike<T extends { _id: string }> = {
  data: T[];
  totalDocs?: number;
};

type SwrMutate<T extends { _id: string } = { _id: string }> = (
  updater?: (pages?: SwrPageLike<T>[]) => SwrPageLike<T>[],
  shouldRevalidate?: boolean,
) => void;

/** Optimistic SWR infinite updater — remove deleted row and decrement totalDocs. */
export function removeDeletedItemFromSwrPages<T extends { _id: string }>(
  pages: SwrPageLike<T>[],
  deletedContentId: string,
): SwrPageLike<T>[] {
  return pages.map((page) => ({
    ...page,
    data: page.data.filter((item) => item._id !== deletedContentId),
    totalDocs: (page.totalDocs ?? page.data.length) - 1,
  }));
}

/** Optimistic detail-page update — mark matching content as DELETED. */
export function applyOptimisticDeleteToContent<
  T extends { _id: string; content?: string },
>(prev: T, deletedContentId: string): T {
  if (prev._id === deletedContentId) {
    return { ...prev, content: "DELETED" };
  }
  return prev;
}

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

  async function confirmDelete<T extends { _id: string; content?: string }>(
    apiLink: string,
    signedInUsersId: string,
    customMutate?: SwrMutate<T>,
    setLocalData?: Dispatch<SetStateAction<T>>,
  ) {
    if (!deleteTarget) return;

    try {
      if (setLocalData) {
        setLocalData((prev) =>
          applyOptimisticDeleteToContent(prev, deleteTarget._id),
        );
      }

      if (customMutate) {
        customMutate(
          (pages = []) =>
            removeDeletedItemFromSwrPages(pages, deleteTarget._id),
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
