import React, { useState } from "react";
import GeneralOpenCloseButton from "../ReusableSmallComponents/buttons/generalOpenCloseButton";
import CoreListingPageLogic from "../CoreListingPagesLogic";

export default function ToggleOneContentPage({
  contentList,
  swrForThisUserID,
  defaultOpen = null,
}) {
  const [openContent, setOpenContent] = useState(defaultOpen);

  function handleContentClick(contentKey) {
    setOpenContent(openContent === contentKey ? null : contentKey);
  }

  return (
    <section>
      <div className="flex justify-center flex-wrap">
        {contentList.map((category) => (
          <GeneralOpenCloseButton
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
