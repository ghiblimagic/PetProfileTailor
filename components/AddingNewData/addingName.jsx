"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";

import { toast } from "react-toastify";

import WarningMessage from "@components/ReusableSmallComponents/buttons/WarningMessage";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";
import TagsSelectAndCheatSheet from "@components/FormComponents/TagsSelectAndCheatSheet";
import { useTags } from "@hooks/useTags";
import StyledTextarea from "@components/FormComponents/StyledTextarea";
import { useSession } from "next-auth/react";

import CheckIfContentExists from "./CheckIfContentExists";
import PreserveTextAfterSubmission from "./preserveTextAfterSubmission";
import ToggeableAlert from "../ReusableMediumComponents/ToggeableAlert";

function NewNameWithTagsData() {
  const [newName, setNewName] = useState("");
  const [isPending, setIsPending] = useState(false);

  const [note, setNote] = useState("");
  const [doNotClear, setDoNotClear] = useState(false);
  const [nameSubmissionMessage, setNameSubmissionMessage] = useState("");
  const [resetCheckContent, setResetCheckContent] = useState(false);

  const [newNameInvalidInput, setNewNameInvalidInput] = useState(null);
  const [checkIsProcessing, setCheckIsProcessing] = useState(false);

  const { data: session, status } = useSession();

  const disabled = session === null ? true : false;

  //   "session in adding names",
  //   session,
  //   session === null,
  //   session === null ? false : true,
  // );

  //regex will return null if none of the characters are invalid, so start with null to begin with

  const { tagsToSubmit, handleSelectChange, handleCheckboxChange, clearTags } =
    useTags();

  //     let nameResponse = await fetch("/api/names/check-if-content-exists/" + nameCheck);
  //     let nameData = await nameResponse.json();
  //     setNameCheckFunctionRun(true);

  //     if (!nameResponse.ok) {
  //       // Handles 400, 409, and other error statuses
  //       // so this shows the invalid error message
  //       setCheckContentMessage(
  //         nameData.message || "Unexpected response from server",
  //       );
  //       setNamesThatExist(nameData.data || []);
  //       return;
  //     }

  //     switch (nameData.type) {
  //       case "duplicate":
  //         setCheckContentMessage(`Ruh Roh! The name ${nameCheck} already exists`);
  //         setNamesThatExist(nameData.data);
  //         break;

  //       case "success":
  //         setCheckContentMessage(nameData.message); // "Success! That name is not in the database"
  //         setNamesThatExist([]);
  //         break;

  //       default:
  //         setCheckContentMessage("Unexpected response");
  //         setNamesThatExist([]);
  //     }
  //   } catch (err) {
  //     setCheckContentMessage("Error checking name: " + err.message);
  //     setNamesThatExist([]);
  //   }
  // }

  //client side validation for name submission section
  useEffect(() => {
    setNewNameInvalidInput(regexInvalidInput(newName));
  }, [newName]);

  function handleNameSubmission(e) {
    e.preventDefault();
    setIsPending(true);

    const nameSubmission = {
      content: newName,
      notes: note,
      tags: tagsToSubmit.map((tag) => tag.value),
    };

    axios
      .post("/api/names", nameSubmission)
      .then((response) => {
        setIsPending(false);
        toast.success(
          `Successfully added name: ${newName}. Heres a treat point as thanks for your contribution ${session.user.name}!`,
        );
        if (!doNotClear) {
          setNewName("");
          setNote("");
          clearTags();
        }
      })
      .catch((error) => {
        console.log("this is error", error);
        setIsPending(false);

        const msg =
          error.response?.data?.message ||
          "Ruh Roh! Something went wrong. Please try again.";
        setNameSubmissionMessage(msg);
      });
    {
      status === "loading" && <p>Loading...</p>;
    }
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
          {/* needs label and value for Select to work  */}

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
            onChange={(e) => {
              setNewName(e.target.value.trimStart());
              if (nameSubmissionMessage !== "") {
                setNameSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
            maxLength="50"
            disabled={disabled}
          ></input>

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

          {/* setNote */}
          <label
            className="font-bold block mb-4 text-xl "
            htmlFor="nameNote"
          >
            Note (optional)
          </label>

          <StyledTextarea
            type="text"
            id="nameNote"
            maxLength="1000"
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
            isDisabled={session === null ? true : false}
          />

          <PreserveTextAfterSubmission
            doNotClear={doNotClear}
            setDoNotClear={setDoNotClear}
          />

          {/* SUBMISSION */}

          {!isPending && (
            <button
              className={`font-bold py-2 px-4 border-b-4 rounded my-4 bg-yellow-300 text-violet-800 border-yellow-100                         hover:bg-blue-500                       hover:text-subtleWhite                   hover:border-blue-700
                    disabled:bg-errorBackgroundColor disabled:text-errorTextColor disabled:border-errorBorderColor disabled:cursor-not-allowed"             `}
              disabled={
                !session || newNameInvalidInput !== null || newName.length < 2
                  ? "disabled"
                  : ""
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
          // <WarningMessage
          //   state={setNameSubmissionMessage}
          //   message={nameSubmissionMessage}
          // />
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

export default NewNameWithTagsData;
