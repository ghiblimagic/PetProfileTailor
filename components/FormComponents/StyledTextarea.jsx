export default function StyledTextarea({
  className,
  onChange,
  required,
  maxLength,
  value,
  ariaLabel,
  name,
  disabled = false,
}) {
  return (
    <textarea
      className={`bg-primary border-subtleWhite  disabled:bg-errorBackgroundColor disabled:text-errorTextColor disabled:cursor-not-allowed text-subtleWhite block rounded-2xl h-32 min-w-[200px] w-[95%] sm:min-w-[400px] mx-auto ${className}`}
      aria-label={ariaLabel}
      onChange={onChange}
      required={required}
      maxLength={maxLength}
      value={value}
      name={name}
      disabled={disabled}
    ></textarea>
  );
}
