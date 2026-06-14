/**
 * Add-name form with tags, notes, and duplicate check.
 * Notes: docs/notes/components/add-content-forms.md
 */
"use client";

import { useEffect, useState, type SubmitEvent, type ChangeEvent } from "react";
import axios from "axios";
import Image from "next/image";
import { toast } from "react-toastify";
import WarningMessage from "@components/shared/feedback/WarningMessage";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";
import TagsSelectAndCheatSheet from "@components/FormComponents/TagsSelectAndCheatSheet";
import { useTags } from "@hooks/useTags";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import { useSession } from "next-auth/react";
import CheckIfContentExists from "./CheckIfContentExists";
import PreserveTextAfterSubmission from "./preserveTextAfterSubmission";
import ToggeableAlert from "../shared/feedback/ToggeableAlert";

export default function NewNameWithTagsData() {
  const [newName, setNewName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [note, setNote] = useState("");
  const [doNotClear, setDoNotClear] = useState(false);
  const [nameSubmissionMessage, setNameSubmissionMessage] = useState("");
  const [resetCheckContent, setResetCheckContent] = useState(false);
  const [newNameInvalidInput, setNewNameInvalidInput] = useState<
    string[] | null
  >(null);
  const [checkIsProcessing, setCheckIsProcessing] = useState(false);

  const { data: session } = useSession();
  const disabled = session === null;

  const { tagsToSubmit, handleSelectChange, handleCheckboxChange, clearTags } =
    useTags();

  useEffect(() => {
    setNewNameInvalidInput(regexInvalidInput(newName));
  }, [newName]);

  function handleNameSubmission(e: SubmitEvent) {
    e.preventDefault();
    setIsPending(true);

    const nameSubmission = {
      content: newName,
      notes: note,
      tags: tagsToSubmit.map((tag) => tag.value),
    };

    axios
      .post("/api/names", nameSubmission)
      .then(() => {
        setIsPending(false);
        toast.success(
          `Successfully added name: ${newName}. Heres a treat point as thanks for your contribution ${session?.user?.name ?? ""}!`,
        );
        if (!doNotClear) {
          setNewName("");
          setNote("");
          clearTags();
        }
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
        setNameSubmissionMessage(msg);
      });
  }

  return (
    <div className="sm:mx-2 w-full text-subtleWhite">
      <section className="mx-auto text-center">
        <p className="font-bold block mt-4 mb-2 text-xl ">
          {" "}
          Add a name with one or more tags.{" "}
        </p>
        <h6 className="mt-4 mb-2 text-center"> Example: A dog named batman </h6>
        <div className="w-52 mx-auto">
          <Image
            className="rounded-2xl mb-4"
            src="/batdog.jpg"
            width={80}
            height={90}
            alt="Image of a pug with a stern batman mask on"
            sizes="100vw"
            style={{
              width: "100%",
              height: "auto",
            }}
          />
        </div>
        <p className="text-center">Batman could have the tags: </p>
        <p>
          #tough, serious or macho #fictional characters #action or superhero
          #male #black
        </p>
        <h4 className="mt-4 underline font-bold"> Submission Guidelines </h4>
        <ul className="">
          <li className="mt-2">
            <strong> Valid characters: </strong> a-z A-Z 0-9 & &apos; - ! ? .
          </li>
          <li className="my-2"> must be 2-40 characters</li>
          <li>buttons will turn on when this criteria is met</li>
        </ul>
        <h5 className="mt-4 underline font-bold">
          {" "}
          The guiding rules when adding content is:
        </h5>
        <ol className="list-decimal list-inside ">
          <li className="my-2">
            Is it likely to get a shelter worker in trouble?
          </li>
          <li>Will this lead to donors pulling much needed funding?</li>
        </ol>
        <p className="mt-2">
          {" "}
          If there&apos;s a small risk, then slap one of these tags on it:
        </p>
        <ul className="list-inside list-disc ">
          <li className="my-2">somewhat negative or slightly controversial </li>
          <li>slightly suggestive </li>
        </ul>{" "}
        <hr className="mt-4" />
        <form
          onSubmit={handleNameSubmission}
          className="w-full max-w-xl mx-auto min-h-fit overflow-hidden"
        >
          {!session && (
            <WarningMessage message="please sign in to submit a name" />
          )}

          <label
            className="font-bold block mt-8 mb-4 text-xl "
            htmlFor="nameInput"
          >
            New Name
          </label>
          <input
            type="text"
            id="nameInput"
            className="bg-secondary border-subtleWhite rounded-2xl disabled:bg-errorBackgroundColor disabled:text-errorTextColor disabled:cursor-not-allowed"
            value={newName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setNewName(e.target.value.trimStart());
              if (nameSubmissionMessage !== "") {
                setNameSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
            maxLength={50}
            disabled={disabled}
          />

          {newNameInvalidInput !== null && (
            <WarningMessage
              message={`${newNameInvalidInput} is not a valid character`}
            />
          )}
          <span className="block my-3">
            {`${50 - newName.length}/50 characters left`}
          </span>

          <CheckIfContentExists
            apiString="/api/names/check-if-content-exists/"
            disabled={disabled}
            contentType="names"
            resetTrigger={resetCheckContent}
            addNamesPage={true}
            value={newName}
            checkIsProcessing={checkIsProcessing}
            setCheckIsProcessing={setCheckIsProcessing}
            invalidInput={newNameInvalidInput}
          />

          <label
            className="font-bold block mb-4 text-xl "
            htmlFor="nameNote"
          >
            Note (optional)
          </label>

          <StyledTextarea
            id="nameNote"
            maxLength={1000}
            value={note}
            className="bg-secondary border-subtleWhite  block "
            onChange={(e) => {
              setNote(e.target.value.trimStart());
              if (nameSubmissionMessage !== "") {
                setNameSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
            disabled={disabled}
          />
          <div className="mb-8 flex flex-col gap-2">
            <span className="mt-3  block">
              {" "}
              {`${1000 - note.length}/1000 characters left`}{" "}
            </span>
            <p>Add anything that would be useful to know.</p>{" "}
            <p>
              Examples: the name&apos;s meaning, popular fictional or historical
              figures with this name.
            </p>
            <p className="block mb-2">
              {" "}
              If you found it on a shelter/rescue&apos;s listing for a pet
              please mention the organization&apos;s name so people can send
              some love their way 😉
            </p>
          </div>
          <TagsSelectAndCheatSheet
            dataType="names"
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
              className={`font-bold py-2 px-4 border-b-4 rounded my-4 bg-yellow-300 text-violet-800 border-yellow-100                         hover:bg-blue-500                       hover:text-subtleWhite                   hover:border-blue-700
                    disabled:bg-errorBackgroundColor disabled:text-errorTextColor disabled:border-errorBorderColor disabled:cursor-not-allowed"             `}
              disabled={
                !session || newNameInvalidInput !== null || newName.length < 2
              }
              type="submit"
            >
              Add name
            </button>
          )}

          {isPending && (
            <button
              className="btn my-4 disabled:bg-errorBackgroundColor disabled:text-errorTextColor disabled:border-errorBorderColor"
              disabled
            >
              {" "}
              Adding name ...{" "}
            </button>
          )}
        </form>
        {nameSubmissionMessage && (
          <ToggeableAlert
            text={nameSubmissionMessage}
            setToggleState={setNameSubmissionMessage}
            toggleState={nameSubmissionMessage}
          />
        )}
      </section>
    </div>
  );
}
