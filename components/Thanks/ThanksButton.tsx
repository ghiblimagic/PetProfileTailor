/**
 * Thanks action on listing rows — opens thanks dialog via parent onClick.
 * Notes: docs/notes/models/moderation-and-thanks.md
 */
"use client";

import type { MouseEventHandler } from "react";
import ContainerForLikeShareFlag from "../Shared/content-actions/ContainerForLikeShareFlag";
import Thanks from "@components/Shared/icons/svg/thanks";

export type ThanksButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export default function ThanksButton({ onClick }: ThanksButtonProps) {
  return (
    <ContainerForLikeShareFlag hoverColor="thanks">
      <button
        className="w-full flex items-center justify-center gap-2"
        // onClick={toggleLike}
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
        onClick={onClick}
        aria-label="Thank"
      >
        <Thanks fill="rgb(221 214 254)" width={33} height={33} />
        <span className="text-sm text-subtleWhite">Send thanks</span>
      </button>
    </ContainerForLikeShareFlag>
  );
}
