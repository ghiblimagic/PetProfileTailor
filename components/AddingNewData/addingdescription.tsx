/**
 * Add-description form with tags, notes, and duplicate check.
 * Notes: docs/notes/components/add-content-forms.md
 */
"use client";

import { useState, type SubmitEvent, type ChangeEvent } from "react";
import axios from "axios";
import Image from "next/image";
import WarningMessage from "../Shared/feedback/WarningMessage";
import { toast } from "react-toastify";
import TagsSelectAndCheatSheet from "../FormComponents/TagsSelectAndCheatSheet";
import { useTags } from "@/hooks/useTags";
import { useSession } from "next-auth/react";
import CheckIfContentExists from "./CheckIfContentExists";
import PreserveTextAfterSubmission from "./preserveTextAfterSubmission";

export default function NewDescriptionWithTagsData() {
  const [newDescription, setNewDescription] = useState("");
  const [doNotClear, setDoNotClear] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [descriptionAlreadyExists, setDescriptionExists] = useState(false);
  const [resetCheckContent, setResetCheckContent] = useState(false);
  const [checkIsProcessing, setCheckIsProcessing] = useState(false);

  const { data: session } = useSession();
  const disabled = session === null;

  const { tagsToSubmit, tagIds, handleSelectChange, handleCheckboxChange } =
    useTags();

  function handleDescriptionSubmission(e: SubmitEvent) {
    e.preventDefault();
    setIsPending(true);

    const descriptionSubmission = {
      content: newDescription,
      tags: tagIds,
      notes,
    };

    axios
      .post("/api/description", descriptionSubmission)
      .then(() => {
        setIsPending(false);
        toast.success(
          `Successfully added description: ${newDescription.slice(
            0,
            10
          )}. Heres a treat point as thanks for your contribution ${
            session?.user?.name ?? ""
          }!`
        );
      })
      .catch((error: unknown) => {
        console.log("this is error", error);
        setIsPending(false);

        const err = error as {
          response?: { data?: { message?: string } };
        };
        const msg =
          err.response?.data?.message ||
          "Ruh Roh! Something went wrong. Please try again.";
        setSubmissionMessage(msg);
      });
  }

  return (
    <div className="mx-auto ">
      <section className="my-6 text-subtleWhite text-center">
        <h3 className="mt-4  font-normal text-lg mb-2">
          {" "}
          Submission Guidelines{" "}
        </h3>
        <p className="text-secondaryText">
          Descriptions must be{" "}
          <strong className="underline"> between 10-4000 characters</strong>{" "}
        </p>

        <h4 className="mt-4 ml-4 text-center py-2"> Example: </h4>
        <div className="w-72 md:w-96 mx-auto">
          <Image
            className="mb-4"
            src="/addingdescriptionexample.jpg"
            width={90}
            height={90}
            alt="Poster of an old large dog sitting patiently which says: I like to sleep through the night. I'll bet you do, too. Because I'm a grown-ass adult. Get a dog who gets you. Adopt adult. APA adoption center"
            sizes="100vw"
            style={{
              width: "100%",
              height: "auto",
            }}
          />
        </div>
        <p className="md:ml-6 text-center text-secondaryText py-2">Tags:</p>
        <div className="flex flex-wrap justify-center gap-2 md:ml-6 mb-2">
          {["senior", "funny", "quiet", "well-behaved"].map((tag) => (
            <span
              key={tag}
              className="bg-white/10 text-subtleWhite text-xs px-3 py-1 rounded-full min-w-0 max-w-full break-words"
            >
              #{tag}
            </span>
          ))}
        </div>

        <form onSubmit={handleDescriptionSubmission}>
          {!session && (
            <span className="mt-4 bg-red-800 p-2 text-subtleWhite font-bold border-2 border-yellow-300 block text-center">
              Please sign in to submit a description{" "}
            </span>
          )}

          <label
            className="font-black block my-4 text-lg "
            htmlFor="descriptionInput"
          >
            Description *required
          </label>

          <textarea
            id="descriptionInput"
            className="block w-full"
            value={newDescription}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              setNewDescription(e.target.value.trimStart());
              if (submissionMessage !== "") {
                setSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
            maxLength={4000}
            disabled={disabled}
            onClick={() => setDescriptionExists(false)}
          />

          <span className="mt-2 inline-block text-secondaryText">
            {" "}
            {`${4000 - newDescription.length}/4000 characters left`}
          </span>

          {descriptionAlreadyExists && (
            <p className="text-red-400 font-bold">
              Ruh Roh! This description already exists!
            </p>
          )}

          <CheckIfContentExists
            apiString="/api/description/check-if-content-exists/"
            disabled={disabled}
            contentType="descriptions"
            resetTrigger={resetCheckContent}
            addNamesPage={true}
            value={newDescription}
            checkIsProcessing={checkIsProcessing}
            setCheckIsProcessing={setCheckIsProcessing}
          />

          <label
            className="font-bold block mt-4 mb-2 text-lg "
            htmlFor="notesinput"
          >
            Notes
          </label>
          <p className="block mb-2 text-secondaryText">
            {" "}
            Enter any notes to add. For example, explaining if it has any
            references to shows/popular culture, ect.
          </p>

          <p className="block mb-2 text-secondaryText">
            If you found it on a shelter/rescue&apos;s listing please mention
            the organization&apos;s name so people can send some love their way
            😉.
          </p>
          <textarea
            id="notesinput"
            className="block w-full"
            value={notes}
            maxLength={800}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              setNotes(e.target.value.trimStart());
              if (submissionMessage !== "") {
                setSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
            disabled={disabled}
          />

          <span className="mt-2 inline-block text-secondaryText">
            {" "}
            {`${800 - notes.length}/800 characters left`}
          </span>

          <label
            className="font-black block mt-6 mb-2 text-lg"
            htmlFor="descriptionTags"
          >
            Tags *required
          </label>
          <span className="block mb-2 text-secondaryText">
            If you type in the tags field, it will filter the tags. Enter at
            least 1 tag.
          </span>
          <TagsSelectAndCheatSheet
            dataType="descriptions"
            tagsToSubmit={tagsToSubmit}
            handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange}
            isDisabled={disabled}
          />

          <PreserveTextAfterSubmission
            doNotClear={doNotClear}
            setDoNotClear={setDoNotClear}
          />

          {!isPending && (
            <button
              className={`font-bold py-2 px-4 border-b-4 rounded     
                disabled:bg-errorBackgroundColor disabled:text-errorTextColor           
                   mt-4 bg-yellow-300 text-violet-800 border-yellow-100   hover:bg-blue-500                       hover:text-subtleWhite                     hover:border-blue-700
               `}
              disabled={!session || newDescription.length < 10}
              type="submit"
            >
              Add description {!session && "(disabled)"}
            </button>
          )}

          {isPending && (
            <button className="btn" disabled>
              {" "}
              Adding description ...{" "}
            </button>
          )}
        </form>

        {submissionMessage && (
          <WarningMessage
            state={setSubmissionMessage}
            message={submissionMessage}
          />
        )}
      </section>
    </div>
  );
}
