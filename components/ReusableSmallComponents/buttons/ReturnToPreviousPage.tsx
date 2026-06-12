/**
 * Back link with arrow icon (single-content pages).
 * Notes: docs/notes/components/reusable-buttons.md
 */
import LinkButton from "./LinkButton";
import { ArrowBigLeftIcon } from "lucide-react";
import type { ComponentProps } from "react";

export type ReturnToPreviousPageProps = {
  href: ComponentProps<typeof LinkButton>["href"];
  text: string;
};

export default function ReturnToPreviousPage({
  href,
  text,
}: ReturnToPreviousPageProps) {
  return (
    <LinkButton
      icon={<ArrowBigLeftIcon className="inline-block" />}
      text={text}
      href={href}
      className="text-subtleWhite hover:bg-blue-700  py-2 pl-2 pr-4 rounded-2xl hover:text-white hover:border-b-2 hover:border-white text-base "
    />
  );
}
