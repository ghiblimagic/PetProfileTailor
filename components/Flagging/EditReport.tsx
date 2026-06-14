/**
 * Edit or delete a pending report inside FlagDialog.
 * Notes: docs/notes/components/flag-report-forms.md
 */
"use client";

import { useState, useEffect, type ChangeEvent, type SubmitEvent } from "react";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import { toast } from "react-toastify";
import axios from "axios";
import { Field } from "@headlessui/react";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import StyledCheckbox from "@components/FormComponents/StyledCheckbox";
import ClosingXButton from "@components/Shared/actions/ClosingXButton";
import DeleteContentNotification from "@components/DeletingData/DeleteContentNotification";
import { useReports } from "@/context/ReportsContext";
import { useSession } from "next-auth/react";
import MustLoginMessage from "@components/Shared/feedback/MustLoginMessage";
import LoadingSpinner from "../Shared/ui/LoadingSpinner";
import type { ContentType } from "@/utils/api/checkIfValidContentType";
import type { ReportContentInfo } from "@/components/Flagging/AddReport";

type SpecificReportResponse = {
  report?: {
    _id: string;
    reportCategories?: string[];
    comments?: string;
  };
};

export type EditReportProps = {
  flaggedByUser?: string;
  contentInfo: ReportContentInfo;
  contentId: string;
  onClose?: () => void;
  dataType: ContentType | string;
};

export default function EditReport({
  flaggedByUser,
  contentInfo,
  contentId,
  onClose,
  dataType,
}: EditReportProps) {
  const { deleteReport } = useReports();
  const { data: session } = useSession();
  const signedInUser = session?.user?.id;

  const [reportCategories, setReportCategories] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get<SpecificReportResponse>(
          "/api/flag/getSpecificReport",
          {
            params: { contentId, userId: flaggedByUser, status: "pending" },
          },
        );

        if (res.data.report) {
          setReportCategories(res.data.report.reportCategories ?? []);
          setComments(res.data.report.comments ?? "");
          setReportId(res.data.report._id);
        }
      } catch (err) {
        console.error("Error fetching specific report", err);
      } finally {
        setLoading(false);
      }
    };

    if (flaggedByUser && contentId) {
      fetchReport();
    }
  }, [flaggedByUser, contentId]);

  const handleReportCategories = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    checked
      ? setReportCategories([...reportCategories, value])
      : setReportCategories(
          reportCategories.filter((flagTitle) => flagTitle !== value),
        );
  };

  const handleDeletion = async () => {
    try {
      await axios.delete("/api/flag/getSpecificReport", {
        data: { reportId },
      });

      deleteReport(dataType, contentId, reportId);
    } catch (err) {
      console.error("Error deleting report", err);
    } finally {
      setLoading(false);
    }

    setShowDeleteConfirmation(false);
    onClose?.();
  };

  const handleSubmitEdit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (reportCategories.length === 0) {
      toast.error(
        `Ruh Roh! You must click 1 or more of the checkboxes for report type`,
      );
      return;
    }
    if (!flaggedByUser) {
      toast.error(`Ruh Roh! You must be signed in to report content`);
      return;
    }

    const profileIsLoggedInUserCheck = contentInfo._id;

    const contentCreatedByUserId =
      contentInfo.createdBy !== undefined
        ? contentInfo.createdBy._id
        : profileIsLoggedInUserCheck;

    if (
      contentCreatedByUserId === flaggedByUser ||
      profileIsLoggedInUserCheck === flaggedByUser
    ) {
      toast.warn(
        `Ruh Roh! Nice try but you can't report your own content silly goose :)`,
      );
      return;
    }

    const reportSubmission = {
      reportId,
      reportCategories,
      comments,
    };

    try {
      await axios.put("/api/flag/getSpecificReport", reportSubmission);
      toast.success(`Thank you for your report! Report successfully updated`);
      onClose?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.log("this is an error", error);
      toast.error(`Ruh Roh! ${err.message ?? "Request failed"}`);
    }
  };

  function cancelFlagFormAndRevertFlagState() {
    onClose?.();
  }

  return (
    <div className=" mx-auto bg-primary rounded-lg  border border-subtleWhite max-w-4xl">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <form onSubmit={handleSubmitEdit}>
            <div className="flex items-center justify-end py-2   bg-secondary ">
              <ClosingXButton
                onClick={cancelFlagFormAndRevertFlagState}
                className="mr-5"
              />
            </div>

            <div className={`-mx-3 mb-6`}>
              <div className=" mb-2 text-subtleWhite sm:px-4 pt-2">
                {!signedInUser && (
                  <MustLoginMessage text="edit or delete a report" />
                )}
                <h2 className="text-center text-xl "> Edit or Delete Report</h2>

                <p className="text-center mb-3">
                  ❗ Note:{" "}
                  <strong> one or more checkboxes must be selected</strong> to
                  submit this form
                </p>

                <p className="text-center mb-3">
                  reports can be edited{" "}
                  <strong>until they are being reviewed</strong>
                </p>

                <div className=" bg-secondary border-white border-y-2 flex">
                  <h3 className=" mb-2 text-xl mx-auto py-3">
                    Report Inappropriate Content
                  </h3>
                </div>

                <div className="flex flex-col gap-4 my-4">
                  <StyledCheckbox
                    label="Hate"
                    description="Slurs, racist or sexist stereotypes, Incitement of fear or discrimination..."
                    checked={reportCategories.includes("Hate")}
                    onChange={handleReportCategories}
                    className="ml-4"
                    value="Hate"
                    disabled={!signedInUser}
                  />

                  <StyledCheckbox
                    label="Violent Speech"
                    description="Violent Threats, Wish of Harm, Coded Incitement of Violence"
                    checked={reportCategories.includes("Violent Speech")}
                    onChange={handleReportCategories}
                    className="ml-4"
                    value="Violent Speech"
                    disabled={!signedInUser}
                  />

                  <StyledCheckbox
                    label="Abuse and Harassment"
                    description="Insults, unwanted advances, targeted harassment and inciting harassment"
                    checked={reportCategories.includes("Abuse and Harassment")}
                    onChange={handleReportCategories}
                    className="ml-4"
                    value="Abuse and Harassment"
                    disabled={!signedInUser}
                  />

                  <StyledCheckbox
                    label="Privacy"
                    description="Sharing private information of others, threatening to share or expose private information"
                    checked={reportCategories.includes("Privacy")}
                    onChange={handleReportCategories}
                    className="ml-4"
                    value="Privacy"
                    disabled={!signedInUser}
                  />

                  <StyledCheckbox
                    label="Spam"
                    description="Fake engagement, scams, malicious links"
                    checked={reportCategories.includes("Spam")}
                    onChange={handleReportCategories}
                    className="ml-4"
                    value="Spam"
                    disabled={!signedInUser}
                  />

                  <StyledCheckbox
                    label="Sensitive or disturbing content"
                    description="Gratuitous gore or violence, nudity & sexual behavior"
                    checked={reportCategories.includes(
                      "Sensitive or disturbing content",
                    )}
                    onChange={handleReportCategories}
                    className="ml-4 text-"
                    value="Sensitive or disturbing content"
                    disabled={!signedInUser}
                  />

                  <StyledCheckbox
                    label="None of these"
                    description="Please give us more information in the comments textbox below"
                    checked={reportCategories.includes("None of these")}
                    onChange={handleReportCategories}
                    className="ml-4"
                    value="None of these"
                    disabled={!signedInUser}
                  />
                </div>

                <div className=" bg-secondary border-white border-y-2 flex">
                  <h3 className=" mb-2 text-xl mx-auto py-3">
                    Additional Comments
                  </h3>
                </div>
                <Field className="mt-4 mx-4 py-2">
                  <StyledTextarea
                    ariaLabel="type-comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    name="body"
                    maxLength={500}
                    placeholder="Optional"
                    disabled={!signedInUser}
                  />
                  <span className="text-subtleWhite mt-4 block ml-1">
                    {`${500 - comments.length}/500 characters left`}
                  </span>
                </Field>

                <Field className="flex gap-24 justify-center">
                  <GeneralButton
                    subtle
                    text="Cancel"
                    onClick={cancelFlagFormAndRevertFlagState}
                  />

                  <GeneralButton
                    type="submit"
                    text="Submit"
                    disabled={!signedInUser}
                  />
                </Field>
              </div>
            </div>
          </form>
          <form className="text-center">
            {" "}
            <h2 className="text-center text-xl text-white "> Delete Report</h2>
            <GeneralButton
              type="button"
              text="delete"
              warning
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={!signedInUser}
            />
            {showDeleteConfirmation && (
              <DeleteContentNotification
                setShowDeleteConfirmation={setShowDeleteConfirmation}
                onConfirm={handleDeletion}
              />
            )}
          </form>
        </>
      )}
    </div>
  );
}
