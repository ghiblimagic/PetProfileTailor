/**
 * Share action on listing rows — toggles SharingOptionsBar via parent.
 */
"use client";

import type { MouseEventHandler } from "react";
import { Share2 } from "lucide-react";
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
    <ContainerForLikeShareFlag hoverColor="share">
      <button
        className="w-full flex items-center justify-center gap-2"
        type="button"
        onClick={onClickShowShares}
        tabIndex={0}
        aria-label="toggle sharing options"
      >
        <Share2
          size={17}
          color="rgb(221 214 254)"
          className={`${shareIconStyling ?? ""}`}
        />
        <span className="text-sm text-subtleWhite">Share</span>
      </button>
    </ContainerForLikeShareFlag>
  );
}
