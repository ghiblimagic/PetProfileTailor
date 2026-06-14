/**
 * Custom 404 page.
 * Notes: docs/notes/app/error-pages.md
 */
"use client";

import Image from "next/image";
import { useState } from "react";
import PageTitleWithImages from "@components/Shared/typography/PageTitleWithImages";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotions";
import ErrorContactMessage from "@/components/Contact/ErrorContactMessage";

export default function Custom404() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hover, setHover] = useState(false);

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
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
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
