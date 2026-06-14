/**
 * List item with paw icon prefix.
 * Notes: docs/notes/components/reusable-small-components.md
 */
import PawPrintIcon from "../icons/PawPrintIcon";

export type ListWithPawPrintIconProps = {
  text: string;
  className?: string;
};

export default function ListWithPawPrintIcon({
  text,
  className,
}: ListWithPawPrintIconProps) {
  return (
    <li className={`my-3 ${className} flex`}>
      <p>
        <PawPrintIcon />
      </p>
      <p>{text}</p>
    </li>
  );
}
