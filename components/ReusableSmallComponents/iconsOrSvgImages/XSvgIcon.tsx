/**
 * Absolute-positioned modal close (X) button.
 * Notes: docs/notes/components/reusable-small-components.md
 */

//needs to be in a relative parent

export type XSvgIconProps = {
  onClickAction: () => void;
  screenReaderText: string;
};

export default function XSvgIcon({
  onClickAction,
  screenReaderText,
}: XSvgIconProps) {
  return (
    <button
      type="button"
      className="text-white absolute top-2.5 right-2.5 bg-transparent
    rounded-lg text-sm p-1.5 ml-auto inline-flex items-center 

    hover:bg-yellow-300
    hover:text-secondary"
      data-modal-toggle="deleteModal"
      onClick={onClickAction}
    >
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        ></path>
      </svg>

      <span className="sr-only">{screenReaderText}</span>
    </button>
  );
}
