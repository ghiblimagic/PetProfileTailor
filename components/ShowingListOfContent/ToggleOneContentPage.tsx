/**
 * Tab buttons that mount one `CoreListingPageLogic` panel at a time (dashboard / profile).
 * Notes: docs/notes/components/toggle-one-content-page.md
 */
"use client";

import { useState } from "react";
import GeneralOpenCloseButton from "../Shared/actions/GeneralOpenCloseButton";
import CoreListingPageLogic from "../CoreListingPagesLogic";

export type ToggleContentTab =
  | "Fav Names"
  | "Fav Descriptions"
  | "Added Names"
  | "Added Descriptions";

export type ToggleContentListItem = {
  text: string;
  className?: string;
  value: ToggleContentTab;
};

export type ToggleOneContentPageProps = {
  contentList: ToggleContentListItem[];
  swrForThisUserID?: string;
  defaultOpen?: ToggleContentTab | null;
};

export default function ToggleOneContentPage({
  contentList,
  swrForThisUserID,
  defaultOpen = null,
}: ToggleOneContentPageProps) {
  const [openContent, setOpenContent] = useState<ToggleContentTab | null>(
    defaultOpen,
  );

  function handleContentClick(contentKey: ToggleContentTab) {
    setOpenContent(openContent === contentKey ? null : contentKey);
  }

  return (
    <section>
      <div className="flex justify-center flex-wrap">
        {contentList.map((category) => (
          <GeneralOpenCloseButton<ToggleContentTab>
            key={category.value}
            text={category.text}
            setState={handleContentClick}
            className={category.className}
            value={category.value}
            state={openContent}
          />
        ))}
      </div>

      {openContent === "Fav Names" && (
        <CoreListingPageLogic
          dataType="names"
          showHeader={false}
          restrictSwrToLikedNames={true}
        />
      )}

      {openContent === "Fav Descriptions" && (
        <CoreListingPageLogic
          dataType="descriptions"
          showHeader={false}
          restrictSwrToLikedNames={true}
        />
      )}

      {openContent === "Added Names" && (
        <CoreListingPageLogic
          dataType="names"
          swrForThisUserID={swrForThisUserID}
          showHeader={false}
          restrictSwrToLikedNames={false}
        />
      )}

      {openContent === "Added Descriptions" && (
        <CoreListingPageLogic
          dataType="descriptions"
          swrForThisUserID={swrForThisUserID}
          showHeader={false}
          restrictSwrToLikedNames={false}
        />
      )}
    </section>
  );
}
