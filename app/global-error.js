"use client";

// need to mark it as useClient, because of the way Next passes errors to this component Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". <... buildId=... assetPrefix="" initialCanonicalUrl=... initialTree=... initialHead=... globalErrorComponent={function} children=...>
import Link from "next/link";
import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import ListWithPawPrintIcon from "@components/ReusableSmallComponents/ListWithPawPrintIcon";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMessage } from "@fortawesome/free-solid-svg-icons";
import PawPrintIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/PawPrintIcon";
import Image from "next/image";
import ErrorContactMessage from "@/components/Contact/ErrorContactMessage";

export default function CustomError() {
  return (
    <>
      <PageTitleWithImages
        title="500"
        title2="Server Error"
      />
      <p className="text-center text-white">
        Ruh-roh! Unfortunately our server got distracted hunting a
        &quot;mouse&quot; 😿.
      </p>

      <div className="relative w-[240px] h-[240px] mx-auto">
        <Image
          src="/server.jpg"
          fill
          priority
          className=""
          style={{ objectPosition: "center", objectFit: "scale-down" }}
          alt=""
        />
      </div>

      <ErrorContactMessage />
    </>
  );
}
