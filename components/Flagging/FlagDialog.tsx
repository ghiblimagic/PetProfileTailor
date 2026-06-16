"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import AddReport from "@/components/Flagging/AddReport";
import { useReports } from "@context/ReportsContext";
import EditReport from "@components/Flagging/EditReport";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

type ListingContent = { _id: string };

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
  const { getStatus } = useReports();
  if (!open || !target) return null;

  const reportStatus = getStatus(dataType, contentId.toString());

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      className="relative z-50 "
    >
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden="true"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <DialogPanel
          className=" bg-secondary sm:p-12 bg-opacity-40 h-fit"
          onClick={(e) => e.stopPropagation()}
        >
          {reportStatus === null && (
            <AddReport
              dataType={dataType}
              contentInfo={target}
              copyOfContentForReport={target}
              apiflagReportSubmission="/api/flag/flagreportsubmission"
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
