/**
 * Duplicate check UI for add-name / add-description forms and fetchname page.
 * Notes: docs/notes/components/check-if-content-exists.md
 */
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import LoadingSpinner from "../Shared/ui/LoadingSpinner";
import ContentListing, {
  type ContentListingItem,
} from "../ShowingListOfContent/ContentListing";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

type CheckContentExistsResponse = {
  type?: "duplicate" | "success" | "invalid";
  message?: string;
  data?: ContentListingItem;
  error?: string;
};

export type CheckIfContentExistsProps = {
  apiString: string;
  disabled?: boolean;
  contentType: ContentType | string;
  resetTrigger?: boolean;
  showFullContent?: boolean;
  addNamesPage?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  invalidInput?: string[] | null;
  checkIsProcessing?: boolean;
  setCheckIsProcessing?: (processing: boolean) => void;
};

export default function CheckIfContentExists({
  apiString,
  contentType,
  resetTrigger,
  showFullContent = false,
  addNamesPage = false,
  value: externalValue,
  onChange: externalOnChange,
  invalidInput,
  checkIsProcessing,
  setCheckIsProcessing,
}: CheckIfContentExistsProps) {
  const [internalContent, setInternalContent] = useState("");
  const [checkContentMessage, setCheckContentMessage] = useState("");
  const [contentCheckFunctionRun, setContentCheckFunctionRun] = useState(false);
  const [existingContent, setExistingContent] = useState<
    ContentListingItem | ""
  >("");

  const [showExistingContent, setShowExistingContent] =
    useState(showFullContent);

  const contentCheck = (externalValue ?? internalContent).slice(0, 400);

  const setContentCheck = externalOnChange ?? setInternalContent;

  function resetData(value: string) {
    setContentCheck(value.toLowerCase());
    setContentCheckFunctionRun(false);
    setExistingContent("");
  }

  useEffect(() => {
    resetData("");
    // reset when parent toggles resetTrigger after input changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  async function contentExistsCheck() {
    try {
      if (checkIsProcessing) return;
      setCheckIsProcessing?.(true);

      const response = await fetch(apiString + contentCheck);
      const data = (await response.json()) as CheckContentExistsResponse;
      setContentCheckFunctionRun(true);

      if (!response.ok) {
        setCheckIsProcessing?.(false);
        setCheckContentMessage(
          data.message || "Unexpected response from server"
        );
        setExistingContent(data.data ?? "");
        return;
      }

      switch (data.type) {
        case "duplicate":
          setCheckContentMessage(
            `Ruh Roh! This content already exists: ${contentCheck} `
          );
          setExistingContent(data.data ?? "");
          break;

        case "success":
          setCheckContentMessage(data.message ?? "");
          setExistingContent("");
          break;

        default:
          setCheckContentMessage("Unexpected response");
          setExistingContent("");
      }
      setCheckIsProcessing?.(false);
    } catch (err) {
      setCheckIsProcessing?.(false);

      const message = err instanceof Error ? err.message : "Unknown error";
      setCheckContentMessage("Error checking name: " + message);
      setExistingContent("");
    }
  }

  return (
    <section className="text-center  pb-4 m-6">
      <h4 className="font-normal block pt-4 m-4 text-xl ">
        {" "}
        {`Check if the ${
          contentType === "names" ? "name" : "description"
        } exists:`}
      </h4>

      <GeneralButton
        className="mt-4 md:mt-0"
        onClick={() => void contentExistsCheck()}
        type="button"
        disabled={
          contentCheck.length < 2 || checkIsProcessing || !!invalidInput
        }
      >
        <FontAwesomeIcon icon={faSearch} className="text-xl" />
        <span className="mx-2">Search</span>
      </GeneralButton>

      {checkIsProcessing && <LoadingSpinner />}

      {contentCheckFunctionRun && addNamesPage && (
        <div className="mx-auto max-w-[90%] mt-4 ">
          {checkContentMessage && (
            <p className="text-sm py-3">{checkContentMessage}</p>
          )}

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
              {showExistingContent && (
                <ContentListing
                  singleContent={existingContent}
                  dataType="names"
                  mode="standalone"
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
