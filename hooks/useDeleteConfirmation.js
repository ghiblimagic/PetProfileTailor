import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "react-toastify";

export function useDeleteConfirmation() {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { mutate: globalMutate } = useSWRConfig();

  function openDelete(target) {
    setDeleteTarget(target);
    setShowDeleteConfirmation(true);
  }

  function closeDelete() {
    setDeleteTarget(null);
    setShowDeleteConfirmation(false);
  }

  /**
   * Deletes a target either using SWR mutate or local state update
   * @param {string} apiLink - API endpoint to call
   * @param {string} signedInUsersId - user ID for backend validation
   * @param {function} [customMutate] - optional SWR mutate function (for SWR mode)
   * @param {function} [setLocalData] - optional local setter (for local mode)
   */

  async function confirmDelete(
    apiLink,
    signedInUsersId,
    customMutate, //swr mode
    setLocalData, // local mode
  ) {
    if (!deleteTarget) return;
    try {
      // ✅ Local optimistic update
      if (setLocalData) {
        setLocalData((prev) => {
          if (!prev) return prev;
          if (prev._id === deleteTarget._id) {
            return { ...prev, content: "DELETED" };
          }
          return prev;
        });
      }

      // ✅ SWR optimistic update
      if (customMutate) {
        customMutate(
          (pages) =>
            pages.map((page) => ({
              ...page,
              data: page.data.filter((item) => item._id !== deleteTarget._id),
              totalDocs: page.totalDocs - 1,
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
      // revalidate all pages if swr was used

      toast.success("Content deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
      // Rollback for local
      if (setLocalData) {
        setLocalData((prev) =>
          prev && prev._id === deleteTarget._id ? deleteTarget : prev,
        );
      }

      toast.error("Failed to delete content. Please try again.");
      if (customMutate) customMutate(); // rollback SWR state
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
