"use client";

const GeneralButton = ({
  text,
  className,
  onClick,
  subtle,
  warning,
  secondary,
  tertiary,
  plain,
  type,
  active = false,
  disabled,
  children,
  dataModalToggle,
  ariaLabel,
}) => {
  const baseClasses =
    "font-bold my-3 py-1 px-4 border-b-4 shadow-lg shadow-stone-900/70 rounded-2xl text-base";

  // Compute background & border
  let bgClass =
    "bg-yellow-300 border-yellow-700 text-secondary  hover:bg-blue-500 hover:text-subtleWhite hover:border-blue-700";
  if (secondary) bgClass = "border-t border-x text-subtleWhite";
  if (tertiary) bgClass = "border-b-0 shadow-none text-subtleWhite";
  if (plain)
    bgClass =
      "bg-transparent border-none text-subtleWhite border-subtleWhite hover:text-subtleWhite hover:border-blue-700 hover:bg-blue-500";
  if (subtle)
    bgClass =
      "bg-subtleBackground text-subtleWhite border-subtleWhite hover:text-subtleWhite hover:border-blue-700 hover:bg-blue-500";
  if (warning)
    bgClass =
      "bg-red-800 text-subtleWhite border-subtleWhite hover:text-subtleWhite hover:border-blue-700 hover:bg-blue-500";
  if (active && !disabled)
    bgClass =
      "bg-subtleWhite border-indigo-600 text-secondary hover:bg-blue-500 hover:text-subtleWhite hover:border-blue-700";
  if (disabled)
    bgClass =
      "bg-slate-300 border-gray-400 text-gray-500 cursor-not-allowed hover:bg-slate-300 hover:text-gray-500 hover:border-gray-400";

  return (
    <button
      className={`${baseClasses} ${bgClass} ${className} `}
      onClick={onClick}
      type={type}
      disabled={disabled}
      data-modal-toggle={dataModalToggle}
      aria-label={ariaLabel}
    >
      <span>{text}</span>
      {children && <span className="flex items-center">{children}</span>}
    </button>
  );
};

export default GeneralButton;
