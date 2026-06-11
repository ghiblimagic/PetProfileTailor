import { Dialog, DialogPanel } from "@headlessui/react";
import DeleteContentNotification from "@components/DeletingData/DeleteContentNotification";

type DeleteTarget = { _id: string };

export type DeleteDialogProps = {
  open: boolean;
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: () => void;
  /** Accepted for caller parity; confirm runs via `onConfirm`. */
  signedInUsersId?: string;
};

export default function DeleteDialog({
  open,
  target,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  if (!open || !target) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      <div
        className="fixed inset-0 bg-black/50 overflow-y-auto"
        aria-hidden="true"
        tabIndex={0}
      >
        <DialogPanel
          className=" bg-secondary sm:p-12 bg-opacity-40 h-fit"
          onClick={(e) => e.stopPropagation()}
        >
          <DeleteContentNotification
            setShowDeleteConfirmation={onClose}
            onConfirm={onConfirm}
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
}
