/**
 * Thanks action on listing rows — opens thanks dialog via parent onClick.
 * Notes: docs/notes/models/moderation-and-thanks.md
 */
"use client";

import type { MouseEventHandler } from "react";
import ContainerForLikeShareFlag from "../shared/content-actions/ContainerForLikeShareFlag";
import Thanks from "@components/shared/icons/svg/thanks";

export type ThanksButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export default function ThanksButton({ onClick }: ThanksButtonProps) {
  return (
    <ContainerForLikeShareFlag>
      <button
        className="w-full flex justify-center"
        // onClick={toggleLike}
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
        onClick={onClick}
        aria-label="Thank"
      >
        <Thanks fill="rgb(221 214 254)" />
      </button>
    </ContainerForLikeShareFlag>
  );
}
