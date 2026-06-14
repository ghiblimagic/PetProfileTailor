/**
 * Edit or delete a pending suggestion inside SuggestionDialog.
 * Notes: docs/notes/components/suggestion-forms.md
 */
"use client";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import { toast } from "react-toastify";
import axios from "axios";
import { Field } from "@headlessui/react";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import StyledCheckbox from "@components/FormComponents/StyledCheckbox";
import ClosingXButton from "@components/Shared/actions/ClosingXButton";
import { useSuggestions } from "@context/SuggestionsContext";
import { useTags } from "@/hooks/useTags";
import TagsSelectAndCheatSheet from "../FormComponents/TagsSelectAndCheatSheet";
import LoadingSpinner from "@components/Shared/ui/LoadingSpinner";
import DeleteContentNotification from "../DeletingData/DeleteContentNotification";
import { useSession } from "next-auth/react";
import MustLoginMessage from "../Shared/feedback/MustLoginMessage";
import type { ContentType } from "@/utils/api/checkIfValidContentType";
import type { SuggestionContentInfo } from "@/components/Suggestions/AddSuggestion";

type SuggestionTagRef = {
  _id: string;
  tag: string;
};

type FetchedSuggestion = {
  _id: string;
  contentType: string;
  description?: string;
  comments?: string;
  incorrectNameTags?: string[];
  incorrectDescriptionTags?: string[];
  nameTagsSuggested?: SuggestionTagRef[];
  descriptionTagsSuggested?: SuggestionTagRef[];
};

type SuggestionGetResponse = {
  suggestion?: FetchedSuggestion;
};

type SuggestionPutResponse = {
  updatedSuggestion: { _id: string };
};

export type EditSuggestionProps = {
  dataType: ContentType | string;
  suggestionBy?: string;
  contentInfo: SuggestionContentInfo;
  apisuggestionSubmission: string;
  onClose?: () => void;
};

export default function EditSuggestion({
  dataType,
  suggestionBy,
  contentInfo,
  apisuggestionSubmission,
  onClose,
}: EditSuggestionProps) {
  const { addSuggestion, deleteSuggestion } = useSuggestions();
  const { data: session } = useSession();
  const signedInUser = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState("");
  const [incorrectTags, setIncorrectTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [suggestionId, setSuggestionId] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { tagsToSubmit, tagIds, handleSelectChange, handleCheckboxChange } =
    useTags();

  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const res = await axios.get<SuggestionGetResponse>("/api/suggestion", {
          params: { contentId: contentInfo._id, status: "pending" },
        });

        const existingSuggestion = res.data.suggestion;

        if (existingSuggestion) {
          const contentType = existingSuggestion.contentType;

          setSuggestionId(existingSuggestion._id);
          setDescription(existingSuggestion.description ?? "");
          setComments(existingSuggestion.comments ?? "");

          if (contentType === "names") {
            setIncorrectTags(existingSuggestion.incorrectNameTags ?? []);
          } else if (contentType === "descriptions") {
            setIncorrectTags(
              existingSuggestion.incorrectDescriptionTags ?? [],
            );
          }

          if (contentType === "names") {
            existingSuggestion.nameTagsSuggested?.forEach((tag) => {
              handleCheckboxChange({
                id: tag._id,
                label: tag.tag,
                checked: true,
              });
            });
          } else if (contentType === "descriptions") {
            existingSuggestion.descriptionTagsSuggested?.forEach((tag) => {
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
    // handleCheckboxChange from useTags is stable enough for one-time hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentInfo._id]);

  const handleSubmitSuggestion = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!suggestionBy) {
      toast.error(`Ruh Roh! You must be signed in to suggestion content`);
      return;
    }

    const contentCreatedByUserId = contentInfo.createdBy._id;

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
      suggestionBy,
      incorrectTags,
      description,
      comments,
      tags: tagIds,
    };

    try {
      const response = await axios.put<SuggestionPutResponse>(
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
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      console.log("this is an error", error);

      toast.error(
        `Ruh Roh! ${err.message ?? "Request failed"} ${JSON.stringify(
          err.response?.data?.message,
        )}`,
      );
    }
  };

  function cancelSuggestionFormAndRevertSuggestionState() {
    onClose?.();
  }

  const handleDeletion = async () => {
    try {
      await axios.delete("/api/suggestion", {
        data: { suggestionId },
      });

      deleteSuggestion(dataType, contentInfo._id, suggestionId);
    } catch (err) {
      console.error("Error deleting suggestion", err);
    } finally {
      setLoading(false);
    }

    setShowDeleteConfirmation(false);
    onClose?.();
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
                            description=""
                            checked={incorrectTags.includes(tag._id)}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
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
                    maxLength={500}
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
                      maxLength={500}
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
                    disabled={!signedInUser}
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
