import { Dialog, DialogPanel } from "@headlessui/react";
import type { ContentType } from "@/utils/api/checkIfValidContentType";
import AddThanks from "./AddThanks";

type ThanksContentInfo = {
  _id: string;
  createdBy: { _id: string };
};

export type ThanksDialogProps = {
  dataType: ContentType | string;
  open: boolean;
  onClose: () => void;
  contentInfo: ThanksContentInfo;
  /** Accepted for caller parity; `AddThanks` reads session user id. */
  signedInUsersId?: string;
};

export default function ThanksDialog({
  dataType,
  open,
  onClose,
  contentInfo,
}: ThanksDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      className="relative z-50 "
    >
      <div
        className="fixed inset-0 bg-black/50 overflow-y-auto"
        aria-hidden="true"
        tabIndex={0}
      >
        <DialogPanel
          className=" bg-secondary sm:p-12 bg-opacity-40 h-fit "
          onClick={(e) => e.stopPropagation()}
        >
          <AddThanks
            dataType={dataType}
            contentInfo={contentInfo}
            apiThanksSubmission="/api/thanks"
            onClose={onClose}
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
}
