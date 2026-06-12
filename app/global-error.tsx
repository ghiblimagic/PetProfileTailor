/**
 * Root error boundary UI (must be a client component).
 * Notes: docs/notes/app/error-pages.md
 */
"use client";

import Image from "next/image";
import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import ErrorContactMessage from "@/components/Contact/ErrorContactMessage";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error: _error, reset: _reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
