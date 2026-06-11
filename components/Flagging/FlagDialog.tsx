"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import AddReport from "@/components/Flagging/AddReport";
import { useReports } from "@context/ReportsContext";
import EditReport from "@components/Flagging/EditReport";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

type ListingContent = { _id: string };

type ReportsContextValue = {
  getStatus: (type: string, contentId: string) => string | null;
};

export type FlagDialogProps = {
  dataType: ContentType | string;
  open: boolean;
  target: ListingContent | null;
  onClose: () => void;
  signedInUsersId?: string;
  contentId: string;
};

export default function FlagDialog({
  dataType,
  open,
  target,
  onClose,
  signedInUsersId,
  contentId,
}: FlagDialogProps) {
  const { getStatus } = useReports() as ReportsContextValue;
  if (!open || !target) return null;

  const reportStatus = getStatus(dataType, contentId.toString());

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
          className=" bg-secondary sm:p-12 bg-opacity-40 h-fit"
          onClick={(e) => e.stopPropagation()}
        >
          {reportStatus === null && (
            <AddReport
              dataType={dataType}
              contentInfo={target}
              copyOfContentForReport={target}
              apiflagReportSubmission="/api/flag/flagreportsubmission/"
              flaggedByUser={signedInUsersId}
              onClose={onClose}
            />
          )}
          {reportStatus === "pending" && (
            <EditReport
              dataType={dataType}
              contentInfo={target}
              contentId={contentId}
              flaggedByUser={signedInUsersId}
              onClose={onClose}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
