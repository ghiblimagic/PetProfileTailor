import React from "react";
import XSvgIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/XSvgIcon";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";

export default function DeleteContentNotification({
  setShowDeleteConfirmation,
  onConfirm,
}) {
  return (
    <div
      className="relative z-10"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-secondary bg-opacity-75 transition-opacity"></div>

      <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto">
        <div className="p-4 text-center sm:p-0 max-w-3xl mx-auto">
          <div
            className="mx-auto flex flex-col font-semibold text-secondary bg-primary
              border-2 border-violet-400 border-dotted 
              p-4 shadow-lg max-w-3xl"
          >
            <div className="relative p-4 text-center rounded-lg shadow dark:bg-secondary sm:p-5">
              {/* Close X */}
              <XSvgIcon
                screenReaderText="Close Delete Confirmaton Screen"
                onClickAction={() => setShowDeleteConfirmation(false)}
              />

              {/* Trash can icon */}
              <svg
                className="subtleWhite w-11 h-11 mb-3.5 mx-auto"
                aria-hidden="true"
                fill="white"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>

              <p className="mb-4 text-subtleWhite  pt-5  ">
                Are you sure you want to delete this?
              </p>

              <p className="mb-4 text-subtleWhite pb-4 ">
                This cannot be undone.
              </p>
              <div className="flex justify-center items-center space-x-6">
                <GeneralButton
                  warning
                  onClick={onConfirm} // ✅ hook handles deletion now
                  text="Yes, I'm sure"
                />
                <GeneralButton
                  tertiary
                  onClick={() => setShowDeleteConfirmation(false)}
                  text="No, cancel"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
