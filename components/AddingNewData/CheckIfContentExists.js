"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import WarningMessage from "@components/ReusableSmallComponents/buttons/WarningMessage";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";
import StyledTextarea from "../FormComponents/StyledTextarea";
import LoadingSpinner from "../ui/LoadingSpinner";
import ContentListing from "../ShowingListOfContent/ContentListing";

export default function CheckIfContentExists({
  apiString,
  disabled,
  contentType,
  resetTrigger,
  showFullContent = false,
  addNamesPage = false,
  value: externalValue,
  onChange: externalOnChange,
  invalidInput,

  checkIsProcessing,
  setCheckIsProcessing,
  // for input for the fetchname page
}) {
  const [internalContent, setInternalContent] = useState("");
  const [checkContentMessage, setCheckContentMessage] = useState("");
  const [contentCheckFunctionRun, setContentCheckFunctionRun] = useState(false);
  const [existingContent, setExistingContent] = useState("");

  //showExistingContent is for the addNames page
  const [showExistingContent, setShowExistingContent] =
    useState(showFullContent);

  // slice(0,400) since the description check has a max of the first 400 characters
  const contentCheck = externalValue.slice(0, 400) ?? internalContent;

  const setContentCheck = externalOnChange ?? setInternalContent;

  const maxContentLength = contentType === "names" ? 50 : 4000;

  useEffect(() => {
    resetData("");
  }, [resetTrigger]);

  console.log("existingContent", existingContent);

  function resetData(value) {
    // const value = e.target.value;
    // const valueNoLeadingSpace = value.replace(/^\s+/u, "");
    // needed for when .trimStart() doesn't recognize the space
    setContentCheck(value.toLowerCase());
    setContentCheckFunctionRun(false);
    setExistingContent("");
    // [] instead of null so it won't break when we check .length later
  }

  async function contentExistsCheck() {
    try {
      if (checkIsProcessing) return;
      setCheckIsProcessing(true);

      //"/api/names/check-if-content-exists/"
      let response = await fetch(apiString + contentCheck);
      let data = await response.json();
      setContentCheckFunctionRun(true);

      if (!response.ok) {
        // Handles 400, 409, and other error statuses
        // so this shows the invalid error message
        setCheckIsProcessing(false);
        setCheckContentMessage(
          data.message || "Unexpected response from server",
        );
        setExistingContent(data.data || "");
        return;
      }

      switch (data.type) {
        case "duplicate":
          setCheckContentMessage(
            `Ruh Roh! This content already exists: ${contentCheck} `,
          );
          setExistingContent(data.data);
          break;

        case "success":
          setCheckContentMessage(data.message); // "Success! That name is not in the database"
          setExistingContent("");
          break;

        default:
          setCheckContentMessage("Unexpected response");
          setExistingContent("");
      }
      setCheckIsProcessing(false);
    } catch (err) {
      setCheckIsProcessing(false);

      setCheckContentMessage("Error checking name: " + err.message);
      setExistingContent("");
    }
  }
  return (
    <section className="text-center  pb-4 m-6">
      <h4 className="font-bold block pt-4 m-4 text-xl ">
        {" "}
        {`Check if a ${
          contentType === "names" ? "name" : "description"
        } exists:`}
      </h4>

      <button
        className="inline-block bg-subtleBackground  mt-4 md:mt-0 p-2 border-2  hover:text-subtleWhite hover:border-blue-700 hover:bg-blue-500 border-subtleWhite  disabled:bg-errorBackgroundColor disabled:text-errorTextColor rounded-2xl disabled:border-errorBorderColor disabled:cursor-not-allowed"
        onClick={() => contentExistsCheck()}
        type="button"
        disabled={contentCheck.length < 2 || checkIsProcessing || invalidInput}
      >
        <FontAwesomeIcon
          icon={faSearch}
          className="text-xl"
          color={"rgb(221 214 254)"} //subtle white
        />

        <span
          className="mx-2
                                       text-purple"
        >
          Search
        </span>
      </button>

      {checkIsProcessing && <LoadingSpinner />}

      {contentCheckFunctionRun && addNamesPage && (
        <div className="mx-auto max-w-[90%] mt-4 ">
          {checkContentMessage && (
            <p className="text-sm py-3">{checkContentMessage}</p>
          )}

          {/* for add a name page */}
          {existingContent && addNamesPage && (
            <div
              className="mt-2 
                                            text-yellow-200 font-bold
                                            bg-red-900 py-2 
                                             border-b-2 border-subtleWhite rounded-2xl"
            >
              <GeneralButton
                className=" my-4 "
                text={showExistingContent ? "hide content" : "show content"}
                onClick={() => setShowExistingContent(!showExistingContent)}
                type="button"
              />
              {existingContent !== "" && showExistingContent && (
                <ContentListing
                  singleContent={existingContent}
                  dataType="names"
                  mode="local"
                  className="mt-4"
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
