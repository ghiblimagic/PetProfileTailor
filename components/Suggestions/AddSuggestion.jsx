"use client";

import { useState } from "react";
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
import { useSession } from "next-auth/react";
import MustLoginMessage from "@components/ui/MustLoginMessage";

export default function AddSuggestion({
  dataType,
  suggestionBy,
  contentInfo,
  apisuggestionSubmission,
  onClose,
}) {
  const { data: session } = useSession();
  const signedInUser = session?.user?.id;

  const { addSuggestion } = useSuggestions();
  const [loading, setLoading] = useState(true);

  const [additionalCommentsState, setAdditionalCommentsState] = useState([]);
  const [incorrectTags, setIncorrectTags] = useState([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState("");

  const { tagsToSubmit, tagIds, handleSelectChange, handleCheckboxChange } =
    useTags();

  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!suggestionBy) {
      toast.error(`Ruh Roh! You must be signed in to suggestion content`);
      return;
    }

    let contentCreatedByUserId = contentInfo.createdBy._id;

    if (contentCreatedByUserId === suggestionBy) {
      toast.warn(
        `Ruh Roh! Nice try but you can't suggestion your own content silly goose :)`,
      );
      setLoading(false);
      return;
    }

    const suggestionSubmission = {
      contentType: dataType,
      contentId: contentInfo._id,
      contentCreator: contentCreatedByUserId,
      suggestionBy: suggestionBy,
      incorrectTags,
      description: descriptionSuggestions,
      comments: additionalCommentsState.toString(),
      tags: tagIds,
      // api will use contentType to figure out if tags are names or description tags
    };
    // console.log(suggestionSubmission);

    try {
      const response = await axios.post(
        apisuggestionSubmission,
        suggestionSubmission,
      );
      setLoading(false);

      toast.success(
        `Thank you for your suggestion! Suggestion successfully sent`,
      );

      addSuggestion(dataType, contentInfo._id, response.data.suggestion._id);

      onClose?.();
    } catch (error) {
      console.log("this is an error", error);
      setLoading(false);
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

  return (
    <form
      className=" mx-auto bg-primary rounded-lg  border border-subtleWhite max-w-4xl"
      onSubmit={handleSubmitSuggestion}
    >
      <div className="flex items-center justify-end py-2   bg-secondary ">
        <ClosingXButton
          onClick={() => cancelSuggestionFormAndRevertSuggestionState()}
          className="mr-5"
        />
      </div>

      <div className={` mb-4`}>
        <div className=" mb-2 text-subtleWhite sm:px-4 ">
          <section className="my-6 p-1">
            <h2 className="text-center  text-2xl ">Suggestions</h2>
            {!signedInUser && <MustLoginMessage text="submit suggestions" />}
            <p className="text-center mt-3 mb-2">
              Thank you for taking the time to help improve our community
              powered database! 🙏🙇
            </p>

            <p className="text-center mb-3">
              ❗ Note: <strong> one or more checkboxes must be selected</strong>{" "}
              to submit this form
            </p>

            <p className="text-center mb-3">
              Suggestions can be edited{" "}
              <strong>until they are being reviewed</strong>
            </p>

            <p className="text-center">
              {" "}
              To prevent harrassment, the submissions will be sent to an admin
              not the original poster
            </p>
          </section>

          <section className="flex flex-col mx-5 my-8">
            <div className=" bg-secondary  rounded-sm flex">
              <h3 className=" mb-2 text-xl mx-auto py-3 ">Incorrect Tags </h3>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <p className="mx-auto">
                Select the incorrect tags and then please comment why the tags
                are incorrect in the textbox at the bottom. Thank you!
              </p>
              <div className="flex  flex-col gap-4 justify-center flex-wrap">
                {contentInfo.tags && contentInfo.tags.length > 0 ? (
                  contentInfo.tags.map((tag) => (
                    <StyledCheckbox
                      key={tag._id}
                      label={tag.tag}
                      checked={incorrectTags.includes(tag._id)}
                      onChange={(e) => setIncorrectTags(e.target.value)}
                      value={tag._id}
                      disabled={!signedInUser}
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
              {`"${contentInfo.notes === "" ? "no notes" : contentInfo.notes}"`}
            </p>
            <StyledTextarea
              onChange={(e) => setDescriptionSuggestions(e.target.value)}
              maxLength="500"
              placeholder=""
              ariaLabel="type-comments"
              name="body"
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
              Please give us more information in the comments textbox below
            </p>

            <Field className="mt-6 mx-4">
              <StyledTextarea
                onChange={(e) => setAdditionalCommentsState(e.target.value)}
                maxLength="500"
                placeholder="Optional"
                ariaLabel="type-comments"
                name="body"
                disabled={!signedInUser}
              />
            </Field>
          </section>

          <Field className="flex gap-24 justify-center">
            <GeneralButton
              text="Cancel"
              warning
              className="mx-2"
              onClick={() => cancelSuggestionFormAndRevertSuggestionState()}
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
  );
}
