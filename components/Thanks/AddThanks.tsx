/**
 * Thanks submission form inside ThanksDialog.
 * Notes: docs/notes/models/moderation-and-thanks.md
 */
"use client";

import { useState, type SubmitEvent } from "react";
import GeneralButton from "@components/shared/actions/GeneralButton";
import { toast } from "react-toastify";
import axios from "axios";
import { Field } from "@headlessui/react";
import StyledCheckbox from "@components/FormComponents/StyledCheckbox";
import ClosingXButton from "@components/shared/actions/ClosingXButton";
import {
  thanksOptionsProfessional,
  thanksOptionsPetOwners,
  thanksOptionsAnyone,
} from "@/data/ThanksOptions";
import type { ContentType } from "@/utils/api/checkIfValidContentType";
import { useSession } from "next-auth/react";
import MustLoginMessage from "@components/shared/feedback/MustLoginMessage";
import LoadingSpinner from "../shared/ui/LoadingSpinner";

type ThanksContentInfo = {
  _id: string;
  createdBy: { _id: string };
};

export type AddThanksProps = {
  dataType: ContentType | string;
  contentInfo: ThanksContentInfo;
  apiThanksSubmission: string;
  onClose?: () => void;
};

export default function AddThanks({
  dataType,
  contentInfo,
  apiThanksSubmission,
  onClose,
}: AddThanksProps) {
  const [selectedThanks, setSelectedThanks] = useState<string[]>([]);
  const { data: session } = useSession();
  const signedInUser = session?.user?.id;
  const [loading, setLoading] = useState(false);

  const handleSubmitThanks = async (e: SubmitEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!signedInUser) {
      setLoading(false);
      toast.error(`Ruh Roh! You must be signed in to thank content`);
      return;
    }

    const contentCreatedByUserId = contentInfo.createdBy._id;

    if (contentCreatedByUserId === signedInUser) {
      setLoading(false);
      toast.warn(
        `Ruh Roh! Nice try but you can't send thanks to your own content silly goose :)`,
      );
      return;
    }

    const thanksSubmission = {
      contentType: dataType,
      contentId: contentInfo._id,
      contentCreator: contentCreatedByUserId,
      messages: selectedThanks,
    };

    try {
      await axios.post(apiThanksSubmission, thanksSubmission);
      setLoading(false);
      toast.success(`Thank you! Your thank your note was successfully sent`);
      onClose?.();
    } catch (error: unknown) {
      console.log("this is an error", error);
      setLoading(false);
      const detail = axios.isAxiosError(error)
        ? `${error.message} ${JSON.stringify(error.response?.data?.message)}`
        : "Request failed";
      toast.error(`Ruh Roh! ${detail}`);
    }
  };

  function cancelThanks() {
    onClose?.();
  }

  const renderOptionGroup = (options: { tag: string }[], heading: string) => (
    <>
      <h4 className="text-center">{heading}</h4>
      {options.map((option) => (
        <StyledCheckbox
          key={option.tag}
          label={option.tag}
          description=""
          checked={selectedThanks.includes(option.tag)}
          onChange={(e) =>
            setSelectedThanks((prev) =>
              prev.includes(e.target.value)
                ? prev.filter((tag) => tag !== e.target.value)
                : [...prev, e.target.value],
            )
          }
          value={option.tag}
          disabled={!signedInUser}
        />
      ))}
    </>
  );

  return (
    <form
      className=" mx-auto bg-primary rounded-lg max-w-4xl border border-subtleWhite"
      onSubmit={handleSubmitThanks}
    >
      <div className="flex items-center justify-end py-2   bg-secondary ">
        <ClosingXButton
          onClick={() => cancelThanks()}
          className="mr-5"
        />
      </div>

      <div className={` mb-4`}>
        <div className=" mb-2 text-subtleWhite sm:px-4 ">
          <section className="my-6">
            {!signedInUser && (
              <MustLoginMessage text="submit thank you notes" />
            )}
            <h2 className="text-center  text-2xl ">Send Thanks</h2>

            <p className="text-center mb-3">
              ❗ Note: <strong> one or more checkboxes must be selected</strong>{" "}
              to submit this form
            </p>
          </section>

          <section className="flex flex-col mx-5 my-8">
            <div className=" bg-secondary  rounded-sm flex">
              <h3 className=" mb-2 text-xl mx-auto py-3 ">Thanks Options </h3>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <p className="text-center">
                Choose as many options as you like. You can mix and match between
                the lists. Send an entire litter worth of thanks if you&apos;re
                feeling it 🐶🐱!
              </p>
              <p className="text-center">
                However to avoid spam, you can only thank a single piece of
                content 10 times.
              </p>
              <p className="text-center">Thanks can not be edited or deleted.</p>
              <div className="flex-col flex justify-center align-items-center md:flex-wrap gap-x-3 gap-y-8 mx-auto my-6">
                {renderOptionGroup(thanksOptionsProfessional, " For Professionals ")}
                {renderOptionGroup(thanksOptionsPetOwners, " For Pet Owners ")}
                {renderOptionGroup(thanksOptionsAnyone, " For Anyone ")}
              </div>
            </div>
          </section>

          <Field className="flex gap-24 justify-center">
            <GeneralButton
              text="Cancel"
              warning
              className="mx-2"
              onClick={() => cancelThanks()}
            />

            <GeneralButton
              type="submit"
              text="Submit"
              subtle
              disabled={!signedInUser || loading}
            />
          </Field>
          {loading && <LoadingSpinner />}
        </div>
      </div>
    </form>
  );
}
