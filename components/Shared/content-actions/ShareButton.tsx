/**
 * Share action on listing rows — toggles SharingOptionsBar via parent.
 */
"use client";

import type { MouseEventHandler } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareFromSquare } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import ContainerForLikeShareFlag from "./ContainerForLikeShareFlag";

export type ShareButtonProps = {
  onClickShowShares: MouseEventHandler<HTMLButtonElement>;
  shareIconStyling?: string;
  /** Reserved — not used in this component yet. */
  shares?: unknown;
};

export default function ShareButton({
  onClickShowShares,
  shareIconStyling,
}: ShareButtonProps) {
  return (
    <ContainerForLikeShareFlag>
      <button
        className="w-full"
        type="button"
        onClick={onClickShowShares}
        tabIndex={0}
        aria-label="toggle sharing options"
      >
        <FontAwesomeIcon
          icon={faShareFromSquare}
          className={`text-xl inline ${shareIconStyling ?? ""}`}
        />
      </button>
    </ContainerForLikeShareFlag>
  );
}
