"use client";

import Image from "next/image";
import { useState } from "react";
import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import ListWithPawPrintIcon from "@components/ReusableSmallComponents/ListWithPawPrintIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMessage } from "@fortawesome/free-solid-svg-icons";
import PawPrintIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/PawPrintIcon";
import GifHover from "@components/ReusableSmallComponents/GifHover";
import Link from "next/link";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotions";
import LinkButton from "@/components/ReusableSmallComponents/buttons/LinkButton";
import GeneralButton from "@/components/ReusableSmallComponents/buttons/GeneralButton";
import ErrorContactMessage from "@/components/Contact/ErrorContactMessage";

export default function Custom404() {
  //grab data from Session and rename data to session

  const prefersReducedMotion = usePrefersReducedMotion();
  const [hover, setHover] = useState(false);

  const handleMouseEnterForImage = () => {
    setHover(true);
  };

  const handleMouseLeaveForImage = () => {
    setHover(false);
  };

  const imageSrc = prefersReducedMotion || hover ? "/404.png" : "/404.gif";

  return (
    <>
      <PageTitleWithImages
        title="404"
        title2="Page Not Found"
      />
      <p className="text-center text-white">
        Ruh-roh! We can&apos;t seem to find that page 😿. It may have expired or
        been removed.
      </p>

      <div
        className="flex justify-center py-4"
        onMouseEnter={handleMouseEnterForImage}
        onMouseLeave={handleMouseLeaveForImage}
      >
        <Image
          src={imageSrc}
          alt="A dog looks confused as they watch their human hide behind a blanket, only for the human to disappear when it falls to the ground "
          width={220}
          height={220}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: 30,
          }}
        />
      </div>

      <ErrorContactMessage />
    </>
  );
}
