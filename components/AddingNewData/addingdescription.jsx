"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import WarningMessage from "../ReusableSmallComponents/buttons/WarningMessage";

import { toast } from "react-toastify";

import TagsSelectAndCheatSheet from "../FormComponents/TagsSelectAndCheatSheet";
import { useTags } from "@/hooks/useTags";
import { useSession } from "next-auth/react";
import CheckIfContentExists from "./CheckIfContentExists";
import PreserveTextAfterSubmission from "./preserveTextAfterSubmission";

function NewDescriptionWithTagsData() {
  const [newDescription, setNewDescription] = useState("");
  const [doNotClear, setDoNotClear] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [descriptionAlreadyExists, setDescriptionExists] = useState(false);
  const [resetCheckContent, setResetCheckContent] = useState(false);
  const [checkIsProcessing, setCheckIsProcessing] = useState(false);

  const { data: session } = useSession();

  const disabled = session === null ? true : false;

  const { tagsToSubmit, tagIds, handleSelectChange, handleCheckboxChange } =
    useTags();

  function handleDescriptionSubmission(e) {
    e.preventDefault();
    setIsPending(true);

    const descriptionSubmission = {
      content: newDescription,
      tags: tagIds,
      notes: notes,
    };

    // #######if the collection does not have the name, do this (allow post):  ..... otherwise update setNameExists to true and do not allow the new description
    axios
      .post("/api/description", descriptionSubmission)
      .then((response) => {
        setIsPending(false);
        toast.success(
          `Successfully added description: ${newDescription.slice(
            0,
            10,
          )}. Heres a treat point as thanks for your contribution ${
            session.user.name
          }!`,
        );
      })
      .catch((error) => {
        console.log("this is error", error);
        setIsPending(false);

        const msg =
          error.response?.data?.message ||
          "Ruh Roh! Something went wrong. Please try again.";
        setSubmissionMessage(msg);
      });
  }

  return (
    <div className="mx-auto ">
      <section className="my-6 text-subtleWhite text-center">
        <p> Add a description with one or more tags. </p>

        <h6 className="mt-4 ml-4 text-center"> Example: </h6>
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
        <p className="md:ml-6 text-center">
          This description could have tags like: senior, funny, quiet,
          well-behaved.
        </p>

        <h4 className="mt-4  font-black text-lg mb-2">
          {" "}
          Submission Guidelines{" "}
        </h4>
        <ul className="">
          <li>
            {" "}
            Descriptions must be{" "}
            <strong className="underline">
              {" "}
              between 10-4000 characters
            </strong>{" "}
            long
          </li>
        </ul>

        <form onSubmit={handleDescriptionSubmission}>
          {!session && (
            <span className="mt-4 bg-red-800 p-2 text-subtleWhite font-bold border-2 border-yellow-300 block text-center">
              Please sign in to submit a description{" "}
            </span>
          )}
          {/* needs label and value for Select to work  */}

          <label
            className="font-bold block my-4 text-lg "
            htmlFor="descriptionInput"
          >
            Description *required
          </label>

          <textarea
            type="text"
            id="nameDescription"
            className="text-subtleWhite block w-full rounded-2xl disabled:bg-errorBackgroundColor bg-secondary border-subtleWhite 
disabled:text-errorTextColor "
            value={newDescription}
            onChange={(e) => {
              setNewDescription(e.target.value.trimStart());
              if (submissionMessage !== "") {
                setSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
            maxLength="4000"
            disabled={disabled}
            onClick={(e) => setDescriptionExists(false)}
          ></textarea>

          <span className="mt-2 inline-block">
            {" "}
            {`${4000 - newDescription.length}/4000 characters left`}
          </span>

          {descriptionAlreadyExists == true && (
            <p className="text-red-500 font-bold">
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

          {/* NOTES SECTION           */}

          <label
            className="font-bold block mt-4 mb-2 text-lg "
            htmlFor="notesinput"
          >
            Notes
          </label>
          <p className="block mb-2">
            {" "}
            Enter any notes to add. For example, explaining if it has any
            references to shows/popular culture, ect
          </p>

          <p className="block mb-2">
            If you found it on a shelter/rescue&apos;s listing for a pet please
            mention the organization&apos;s name so people can send some love
            their way 😉
          </p>
          <textarea
            type="text"
            id="noteinput"
            className="text-subtleWhite block w-full disabled:bg-errorBackgroundColor  bg-secondary border-subtleWhite
disabled:text-errorTextColor rounded-2xl"
            value={notes}
            maxLength="800"
            onChange={(e) => {
              setNotes(e.target.value.trimStart());
              if (submissionMessage !== "") {
                setSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
            disabled={disabled}
          ></textarea>

          <span className="mt-2 inline-block">
            {" "}
            {`${800 - notes.length}/800 characters left`}
          </span>

          {/* TAGS SECTION */}
          <label
            className="font-bold block mt-4 mb-2 text-lg"
            htmlFor="descriptionTags"
          >
            Tags *required
          </label>
          <span className="block mb-2">
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

          {/* BUTTON */}

          {!isPending && (
            <button
              className={`font-bold py-2 px-4 border-b-4 rounded     
                disabled:bg-errorBackgroundColor disabled:text-errorTextColor           
                   mt-4 bg-yellow-300 text-violet-800 border-yellow-100   hover:bg-blue-500                       hover:text-subtleWhite                     hover:border-blue-700
               `}
              disabled={
                !session || newDescription.length < 10 ? "disabled" : ""
              }
              onClick={handleDescriptionSubmission}
            >
              Add description {!session && "(disabled)"}
            </button>
          )}

          {isPending && (
            <button
              className="btn"
              disabled
            >
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

export default NewDescriptionWithTagsData;
