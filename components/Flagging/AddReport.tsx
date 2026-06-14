/**
 * New report submission form inside FlagDialog.
 * Notes: docs/notes/components/flag-report-forms.md
 */
"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import { toast } from "react-toastify";
import axios from "axios";
import { Field } from "@headlessui/react";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import StyledCheckbox from "@components/FormComponents/StyledCheckbox";
import ClosingXButton from "@components/Shared/actions/ClosingXButton";
import { useReports } from "@context/ReportsContext";
import { useSession } from "next-auth/react";
import MustLoginMessage from "@components/Shared/feedback/MustLoginMessage";
import LoadingSpinner from "../Shared/ui/LoadingSpinner";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

export type ReportContentInfo = {
  _id: string;
  createdBy?: { _id: string };
};

type FlagReportPostResponse = {
  report: { _id: string };
  message: string;
};

export type AddReportProps = {
  dataType: ContentType | string;
  flaggedByUser?: string;
  contentInfo: ReportContentInfo;
  copyOfContentForReport: Record<string, unknown>;
  apiflagReportSubmission: string;
  onClose?: () => void;
};

export default function AddReport({
  dataType,
  flaggedByUser,
  contentInfo,
  copyOfContentForReport,
  apiflagReportSubmission,
  onClose,
}: AddReportProps) {
  const { addReport } = useReports();
  const { data: session } = useSession();
  const signedInUser = session?.user?.id;
  const [loading, setLoading] = useState(false);

  const [flagCategoriesState, setFlagCategoriesState] = useState<string[]>([]);
  const [additionalCommentsState, setAdditionalCommentsState] = useState("");

  const handleFlagCategoriesState = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    checked
      ? setFlagCategoriesState([...flagCategoriesState, value])
      : setFlagCategoriesState(
          flagCategoriesState.filter((flagTitle) => flagTitle !== value),
        );
  };

  const handleSubmitReport = async (e: SubmitEvent) => {
    e.preventDefault();
    setLoading(true);

    if (flagCategoriesState.length === 0) {
      setLoading(false);
      toast.error(
        `Ruh Roh! You must click 1 or more of the checkboxes for report type`,
      );
      return;
    }
    if (!flaggedByUser) {
      setLoading(false);
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
      setLoading(false);
      toast.warn(
        `Ruh Roh! Nice try but you can't report your own content silly goose :)`,
      );
      return;
    }

    const reportSubmission = {
      contentType: dataType,
      contentId: contentInfo._id,
      contentCopy: copyOfContentForReport,
      contentCreatedBy: contentCreatedByUserId,
      reportedBy: flaggedByUser,
      reportCategories: flagCategoriesState,
      comments: additionalCommentsState,
    };

    try {
      const response = await axios.post<FlagReportPostResponse>(
        apiflagReportSubmission,
        reportSubmission,
      );

      toast.success(
        `Thank you for your report! Report for ${response.data.message} successfully sent`,
      );

      addReport(dataType, contentInfo._id, response.data.report._id);
      setLoading(false);

      onClose?.();
    } catch (error: unknown) {
      console.log("this is an error", error);
      setLoading(false);

      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };

      toast.error(
        `Ruh Roh! ${err.message ?? "Request failed"} ${JSON.stringify(
          err.response?.data?.message,
        )}`,
      );
    }
  };

  function cancelFlagFormAndRevertFlagState() {
    onClose?.();
  }

  return (
    <form
      className=" mx-auto bg-primary rounded-lg  border border-subtleWhite max-w-4xl"
      onSubmit={handleSubmitReport}
    >
      <div className="flex items-center justify-end py-2   bg-secondary ">
        <ClosingXButton
          onClick={cancelFlagFormAndRevertFlagState}
          className="mr-5"
        />
      </div>

      <div className={`-mx-3 mb-6`}>
        <div className=" mb-2 text-subtleWhite px-4 pt-2">
          {!signedInUser && <MustLoginMessage text="submit a report" />}
          <section className="p-1">
            <h2 className="text-center text-xl ">Report Content</h2>
            <p className="text-center mt-3 mb-2">
              Thank you for taking the time to help improve our community
              powered database! 🙏🙇
            </p>

            <p className="text-center mb-3">
              ❗ Note: <strong> one or more checkboxes must be selected</strong>{" "}
              to submit this form
            </p>

            <p className="text-center mb-3">
              {" "}
              Reports can be edited{" "}
              <strong>until they are being reviewed</strong>
            </p>
          </section>

          <div className=" bg-secondary border-white border-y-2 ">
            <h3 className=" mb-2 text-xl  text-center py-3">
              Report Inappropriate Content
            </h3>
          </div>

          <div className="flex flex-col gap-4 my-4 mx-4">
            <StyledCheckbox
              label="Hate"
              description="Slurs, racist or sexist stereotypes, Incitement of fear or discrimination..."
              checked={flagCategoriesState.includes("Hate")}
              onChange={handleFlagCategoriesState}
              className="ml-4"
              value="Hate"
              disabled={!signedInUser}
            />

            <StyledCheckbox
              label="Violent Speech"
              description="Violent Threats, Wish of Harm, Coded Incitement of Violence"
              checked={flagCategoriesState.includes("Violent Speech")}
              onChange={handleFlagCategoriesState}
              className="ml-4"
              value="Violent Speech"
              disabled={!signedInUser}
            />

            <StyledCheckbox
              label="Abuse and Harassment"
              description="Insults, unwanted advances, targeted harassment and inciting harassment"
              checked={flagCategoriesState.includes("Abuse and Harassment")}
              onChange={handleFlagCategoriesState}
              className="ml-4"
              value="Abuse and Harassment"
              disabled={!signedInUser}
            />

            <StyledCheckbox
              label="Privacy"
              description="Sharing private information of others, threatening to share or expose private information"
              checked={flagCategoriesState.includes("Privacy")}
              onChange={handleFlagCategoriesState}
              className="ml-4"
              value="Privacy"
              disabled={!signedInUser}
            />

            <StyledCheckbox
              label="Spam"
              description="Fake engagement, scams, malicious links"
              checked={flagCategoriesState.includes("Spam")}
              onChange={handleFlagCategoriesState}
              className="ml-4"
              value="Spam"
              disabled={!signedInUser}
            />

            <StyledCheckbox
              label="Sensitive or disturbing content"
              description="Gratuitous gore or violence, nudity & sexual behavior"
              checked={flagCategoriesState.includes(
                "Sensitive or disturbing content",
              )}
              onChange={handleFlagCategoriesState}
              className="ml-4"
              value="Sensitive or disturbing content"
              disabled={!signedInUser}
            />

            <StyledCheckbox
              label="None of these"
              description="Please give us more information in the comments textbox below"
              checked={flagCategoriesState.includes("None of these")}
              onChange={handleFlagCategoriesState}
              className="ml-4"
              value="None of these"
              disabled={!signedInUser}
            />
          </div>

          <div className=" bg-secondary border-white border-y-2 flex">
            <h3 className=" mb-2 text-xl mx-auto py-3">Additional Comments</h3>
          </div>
          <Field className="mt-4 mx-4 py-2">
            <StyledTextarea
              ariaLabel="type-comments"
              onChange={(e) => setAdditionalCommentsState(e.target.value)}
              name="body"
              maxLength={500}
              placeholder="Optional"
              disabled={!signedInUser}
            />
            <span className="text-subtleWhite mt-4 block ml-1">
              {`${500 - additionalCommentsState.length}/500 characters left`}
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
              disabled={!signedInUser || loading}
            />
          </Field>

          {loading && <LoadingSpinner />}
        </div>
      </div>
    </form>
  );
}
