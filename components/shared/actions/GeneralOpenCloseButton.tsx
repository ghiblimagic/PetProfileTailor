/**
 * Tab-style toggle button (profile/dashboard content tabs).
 * Notes: docs/notes/components/reusable-buttons.md
 */
export type GeneralOpenCloseButtonProps<T extends string> = {
  state: T | null;
  text: string;
  value: T;
  className?: string;
  setState: (value: T) => void;
  sideText?: string;
};

export default function GeneralOpenCloseButton<T extends string>({
  state,
  text,
  value,
  className,
  setState,
  sideText,
}: GeneralOpenCloseButtonProps<T>) {
  return (
    <button
      className={`hover:rounded-2xl
    text-subtleWhite  font-bold py-2 px-4 
    hover:bg-blue-500
    hover:border-blue-600 text-base
    ${state === value && "border-b-4 border-subtleWhite"}
    ${className} `}
      onClick={() => setState(value)}
    >
      {/* bg-subtleBackground  border-b-4 border-subtleWhite  */}
      <div className="flex">
        <p className="whitespace-normal break-words mr-2">{text}</p>
        {sideText && <span> {sideText}</span>}
      </div>
    </button>
  );
}
