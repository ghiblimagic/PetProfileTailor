/**
 * Centered heading with configurable h-level (settings, avatar upload).
 * Notes: docs/notes/components/reusable-small-components.md
 */
import type { JSX } from "react";

export type HeadingLevel = "1" | "2" | "3" | "4" | "5" | "6";

export type SmallCenteredHeadingProps = {
  heading: string;
  level?: HeadingLevel;
};

export default function SmallCenteredHeading({
  heading,
  level = "3",
}: SmallCenteredHeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag
      className="text-xl md:text-xl font-semibold py-4 text-center bg-secondary text-subtleWhite
     border-y-2 border-subtleWhite"
    >
      {heading}
    </Tag>
  );
}
