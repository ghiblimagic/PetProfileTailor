"use client";

import { useState, useEffect } from "react";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import { toast } from "react-toastify";
import axios from "axios";
import { Field } from "@headlessui/react";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import StyledCheckbox from "@components/FormComponents/StyledCheckbox";
import ClosingXButton from "@components/ReusableSmallComponents/buttons/ClosingXButton";
import { useSuggestions } from "@context/SuggestionsContext";
import { useTags } from "@/hooks/useTags";
import TagsSelectAndCheatSheet from "../FormComponents/TagsSelectAndCheatSheet";
import LoadingSpinner from "@components/ui/LoadingSpinner";
import DeleteContentNotification from "../DeletingData/DeleteContentNotification";
import { useSession } from "next-auth/react";
import MustLoginMessage from "../ui/MustLoginMessage";

export default function EditSuggestion({
  dataType,
  suggestionBy,
  contentInfo,
  apisuggestionSubmission,
  onClose,
}) {
  const { addSuggestion, deleteSuggestion } = useSuggestions();
  const { data: session } = useSession();
  const signedInUser = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [incorrectTags, setIncorrectTags] = useState([]);
  const [description, setDescription] = useState("");
  const [suggestionId, setSuggestionId] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { tagsToSubmit, tagIds, handleSelectChange, handleCheckboxChange } =
    useTags();

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const res = await axios.get("/api/suggestion", {
          params: { contentId: contentInfo._id, status: "pending" },
        });
        // console.log("response", res.data);
        const existingSuggestion = res.data.suggestion;

        if (existingSuggestion) {
          const contentType = existingSuggestion.contentType;

          setSuggestionId(existingSuggestion._id); // keep the id so we can update it later

          setDescription(existingSuggestion.description || "");
          setComments(existingSuggestion.comments || "");

          // incorrect tags
          if (contentType === "names") {
            setIncorrectTags(existingSuggestion.incorrectNameTags || []);
          } else if (contentType === "descriptions") {
            setIncorrectTags(existingSuggestion.incorrectDescriptionTags || []);
          }
          // suggested tags
          if (contentType === "names") {
            existingSuggestion.nameTagsSuggested.forEach((tag) => {
              handleCheckboxChange({
                id: tag._id,
                label: tag.tag,
                checked: true,
              });
            });
          } else if (contentType === "descriptions") {
            existingSuggestion.descriptionTagsSuggested.forEach((tag) => {
              handleCheckboxChange({
                id: tag._id,
                label: tag.tag,
                checked: true,
              });
            });
          }
        }
      } catch (err) {
        console.error("Error fetching specific suggestion", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestion();
  }, [contentInfo]);

  // ################# EDIT #####################

  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();

    if (!suggestionBy) {
      toast.error(`Ruh Roh! You must be signed in to suggestion content`);
      return;
    }

    let contentCreatedByUserId = contentInfo.createdBy._id;

    if (contentCreatedByUserId === suggestionBy) {
      toast.warn(
        `Ruh Roh! Nice try but you can't suggestion your own content silly goose :)`,
      );
      return;
    }

    const suggestionSubmission = {
      contentType: dataType,
      contentId: contentInfo._id,
      suggestionId,
      contentCreator: contentCreatedByUserId,
      suggestionBy: suggestionBy,
      incorrectTags,
      description,
      comments: comments.toString(),
      tags: tagIds,
      // api will use contentType to figure out if tags are names or description tags
    };
    // console.log(suggestionSubmission);

    try {
      const response = await axios.put(
        apisuggestionSubmission,
        suggestionSubmission,
      );

      toast.success(`Suggestion successfully edited!`);

      addSuggestion(
        dataType,
        contentInfo._id,
        response.data.updatedSuggestion._id,
      );

      onClose?.();
    } catch (error) {
      console.log("this is an error", error);

      toast.error(
        `Ruh Roh! ${error.message} ${JSON.stringify(
          error?.response?.data?.message,
        )}`,
      );
    }
  };

  function cancelSuggestionFormAndRevertSuggestionState() {
    onClose?.(); // <-- close the dialog
  }

  // ################ DELETION #################

  const handleDeletion = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.delete("/api/suggestion", {
        data: { suggestionId: suggestionId },
      });
      // console.log("response", res.data);

      deleteSuggestion(dataType, contentInfo._id, suggestionId);
    } catch (err) {
      console.error("Error fetching specific suggestion", err);
    } finally {
      setLoading(false);
    }

    setShowDeleteConfirmation(false);
    onClose();
    // console.log("deleted");
  };

  return (
    <div className=" mx-auto bg-primary rounded-lg  border border-subtleWhite max-w-4xl ">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <form onSubmit={handleSubmitSuggestion}>
            <div className="flex items-center justify-end py-2   bg-secondary ">
              <ClosingXButton
                onClick={() => cancelSuggestionFormAndRevertSuggestionState()}
                className="mr-5"
              />
            </div>

            <div className={` mb-4`}>
              <div className=" mb-2 text-subtleWhite sm:px-4 ">
                <section className="my-6">
                  {!session && (
                    <MustLoginMessage text="edit or delete a suggestion" />
                  )}

                  <h2 className="text-center  text-2xl ">Edit Suggestion</h2>

                  <p className="text-center mb-3">
                    Suggestions can be edited{" "}
                    <strong>until they are being reviewed</strong>
                  </p>
                  <p className="text-center mb-3">
                    {" "}
                    To prevent harrassment, the submissions will be sent to an
                    admin not the original poster
                  </p>

                  <p className="text-center mb-3">
                    ❗ Note:{" "}
                    <strong> one or more checkboxes must be selected</strong> to
                    submit this form
                  </p>
                </section>

                <section className="flex flex-col mx-5 my-8">
                  <div className=" bg-secondary  rounded-sm flex">
                    <h3 className=" mb-2 text-xl mx-auto py-3 ">
                      Incorrect Tags{" "}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-4 mt-4">
                    <p className="mx-auto">
                      Select the incorrect tags and then please comment why the
                      tags are incorrect in the textbox at the bottom. Thank
                      you!
                    </p>
                    <div className="flex  flex-col gap-4 justify-center flex-wrap">
                      {contentInfo.tags && contentInfo.tags.length > 0 ? (
                        contentInfo.tags.map((tag) => (
                          <StyledCheckbox
                            key={tag._id}
                            label={tag.tag}
                            checked={incorrectTags.includes(tag._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setIncorrectTags((prev) => [...prev, tag._id]);
                              } else {
                                setIncorrectTags((prev) =>
                                  prev.filter((id) => id !== tag._id),
                                );
                              }
                            }}
                            value={tag._id}
                          />
                        ))
                      ) : (
                        <p>No tags</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className=" bg-secondary  rounded-sm flex mt=6 mb-16">
                  <h3 className=" mb-2 text-xl mx-auto py-3 ">Add Tags </h3>
                </div>

                <TagsSelectAndCheatSheet
                  dataType={dataType}
                  tagsToSubmit={tagsToSubmit}
                  handleSelectChange={handleSelectChange}
                  handleCheckboxChange={handleCheckboxChange}
                  isDisabled={!signedInUser}
                />

                <div className=" bg-secondary rounded-sm flex mt-16">
                  <h3 className=" mb-2 text-xl mx-auto py-3 ">
                    Suggest Changes to Notes{" "}
                  </h3>
                </div>

                <Field className="mt-6 mx-4">
                  <p className="text-center my-4">
                    {" "}
                    {`"${
                      contentInfo.notes === "" ? "no notes" : contentInfo.notes
                    }"`}
                  </p>
                  <StyledTextarea
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength="500"
                    placeholder=""
                    ariaLabel="type-comments"
                    name="body"
                    value={description}
                    disabled={!signedInUser}
                  />
                </Field>

                <section>
                  <div className=" bg-secondary  rounded-sm mx-5 mb-10 flex mt-6">
                    <h3 className=" my-2 text-xl mx-auto py-3 ">
                      Additional Comments
                    </h3>
                  </div>
                  <p className="text-center">
                    Please give us more information in the comments textbox
                    below
                  </p>

                  <Field className="mt-6 mx-4">
                    <StyledTextarea
                      onChange={(e) => setComments(e.target.value)}
                      maxLength="500"
                      placeholder="Optional"
                      ariaLabel="type-comments"
                      name="body"
                      value={comments}
                      disabled={!signedInUser}
                    />
                  </Field>
                </section>

                <Field className="flex gap-24 justify-center">
                  <GeneralButton
                    text="Cancel"
                    warning
                    className="mx-2"
                    onClick={() =>
                      cancelSuggestionFormAndRevertSuggestionState()
                    }
                    disabled={!signedInUser}
                  />

                  <GeneralButton
                    type="submit"
                    text="Submit"
                    default
                  />
                </Field>
              </div>
            </div>
          </form>
          <form className="text-center">
            {" "}
            <h2 className="text-center text-xl text-white ">
              {" "}
              Delete Suggestion
            </h2>
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
