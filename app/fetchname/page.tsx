/**
 * Public name lookup: type a name and run duplicate check.
 * Notes: docs/notes/app/fetchname-page.md
 */
"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import PageTitleWithImages from "@components/shared/typography/PageTitleWithImages";
import CheckIfContentExists from "@/components/AddingNewData/CheckIfContentExists";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";
import WarningMessage from "@/components/shared/feedback/WarningMessage";

const MAX_NAME_LENGTH = 50;

export default function FetchNamePage() {
  const [nameCheck, setNameCheck] = useState("");
  const [nameSubmissionMessage, setNameSubmissionMessage] = useState("");
  const [resetCheckContent, setResetCheckContent] = useState(false);
  const [checkIsProcessing, setCheckIsProcessing] = useState(false);
  const [nameInvalidInput, setNameInvalidInput] = useState<string[] | null>(
    null,
  );

  useEffect(() => {
    setNameInvalidInput(regexInvalidInput(nameCheck));
  }, [nameCheck]);

  return (
    <div className="min-h-fit  overflow-hidden text-white w-full">
      <PageTitleWithImages
        imgSrc="bg-[url('https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/Z5QQMNJZGJDSVJFNHHR3QYNMCE.jpg')] "
        title="Find A"
        title2="Name"
      />

      <div className="mx-auto mt-4 flex justify-center text-center flex-col">
        <div>
          <input
            type="text"
            className={`bg-secondary border-subtleWhite rounded-2xl mr-2 ${
              checkIsProcessing &&
              "disabled:bg-errorBackgroundColor   disabled:text-errorTextColor disabled:border-errorBorderColor disabled:cursor-not-allowed"
            }`}
            value={nameCheck}
            id="checkExists"
            disabled={checkIsProcessing}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setNameCheck(e.target.value.trimStart());
              if (nameSubmissionMessage !== "") {
                setNameSubmissionMessage("");
              }
              setResetCheckContent((prev) => !prev);
            }}
          />
          <span className="block mt-3">
            {`${
              MAX_NAME_LENGTH - nameCheck.length
            }/${MAX_NAME_LENGTH} characters left`}{" "}
          </span>
        </div>

        {nameInvalidInput !== null && (
          <WarningMessage
            message={`${nameInvalidInput} is not a valid character`}
          />
        )}

        <CheckIfContentExists
          apiString="/api/names/check-if-content-exists/"
          disabled={false}
          contentType="names"
          showFullContent={true}
          resetTrigger={resetCheckContent}
          addNamesPage={true}
          value={nameCheck}
          checkIsProcessing={checkIsProcessing}
          setCheckIsProcessing={setCheckIsProcessing}
          invalidInput={nameInvalidInput}
        />
      </div>
    </div>
  );
}
