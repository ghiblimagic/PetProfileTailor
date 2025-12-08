"use client";

import { useState, useEffect } from "react";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import { toast } from "react-toastify";
import axios from "axios";
import { Field } from "@headlessui/react";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import StyledCheckbox from "@components/FormComponents/StyledCheckbox";
import ClosingXButton from "@components/ReusableSmallComponents/buttons/ClosingXButton";
import DeleteContentNotification from "@components/DeletingData/DeleteContentNotification";
import { useReports } from "@/context/ReportsContext";
import { useSession } from "next-auth/react";
import MustLoginMessage from "@components/ui/MustLoginMessage";
import LoadingSpinner from "../ui/LoadingSpinner";

function EditReport({
  flaggedByUser,
  contentInfo,
  contentId,
  onClose,
  dataType,
}) {
  // api to grab content by contentId

  // pages\api\flag\getSpecificReport\route.js

  const { deleteReport } = useReports();
  const { data: session } = useSession();
  const signedInUser = session?.user?.id;

  const [reportCategories, setReportCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    // console.log("edit report ran", contentId);
    const fetchReport = async () => {
      try {
        const res = await axios.get("/api/flag/getSpecificReport", {
          params: { contentId, userId: flaggedByUser, status: "pending" },
        });
        // console.log("response", res.data);

        if (res.data.report) {
          setReportCategories(res.data.report.reportCategories || []);
          setComments(res.data.report.comments || "");
          setReportId(res.data.report._id); // keep the id so we can update it later
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

  const handleReportCategories = (e) => {
    const { value, checked } = e.target;

    checked
      ? setReportCategories([...reportCategories, value])
      : setReportCategories(
          reportCategories.filter((flagTitle) => flagTitle != value),
        );
  };

  // ################ DELETION #################

  const handleDeletion = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.delete("/api/flag/getSpecificReport", {
        data: { reportId },
      });
      // console.log("response", res.data);

      deleteReport(dataType, contentId, reportId);

      if (res.data.report) {
        setReportCategories(res.data.report.reportCategories || []);
        setComments(res.data.report.comments || "");
        setReportId(res.data.report._id); // keep the id so we can update it later
      }
    } catch (err) {
      console.error("Error fetching specific report", err);
    } finally {
      setLoading(false);
    }

    setShowDeleteConfirmation(false);
    onClose();
    // console.log("deleted");
  };

  // ################ EDIT #################
  const handleSubmitEdit = async (e) => {
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

    //dealing with the edge case because of profile pages, profile pages won't have a createdBy property
    let profileIsLoggedInUserCheck = contentInfo._id;

    let contentCreatedByUserId =
      contentInfo.createdBy != undefined
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
    // console.log(reportSubmission);

    await axios
      .put("/api/flag/getSpecificReport", reportSubmission)
      .then((response) => {
        toast.success(`Thank you for your report! Report successfully updated`);
      })
      // .then(() => callApiToaddUserToNamesArray(userAndNameId))
      .then(() => {
        onClose();
      })

      .catch((error) => {
        console.log("this is an error", error);

        toast.error(`Ruh Roh! ${error.message}`);
      });
  };

  function cancelFlagFormAndRevertFlagState() {
    onClose?.(); // <-- close the dialog
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
              {/* Area to Type a comment  */}

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
                    maxLength="500"
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
                    default
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

export default EditReport;
