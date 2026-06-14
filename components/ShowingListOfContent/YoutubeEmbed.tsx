/**
 * Lazy YouTube iframe with close button (landing page videos).
 * Notes: docs/notes/components/showing-list-of-content/youtube-and-social-lists.md
 */
"use client";

import { useState } from "react";
import GeneralButton from "@components/shared/actions/GeneralButton";
import LoadingSpinner from "../ui/LoadingSpinner";

export type YoutubeEmbedProps = {
  embedId: string;
  styling?: string;
  title: string;
  showVideoFunction: (open: boolean) => void;
};

export default function YoutubeEmbed({
  embedId,
  styling = "",
  title,
  showVideoFunction,
}: YoutubeEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="mt-2 py-4 text-center bg-secondary">
      {!loaded && <LoadingSpinner />}

      <GeneralButton
        text="close X"
        subtle
        className={`mb-3 mx-auto ${loaded ? "block" : "hidden"}`}
        onClick={() => showVideoFunction(false)}
        type="button"
      />

      <iframe
        className={`mx-auto aspect-video w-[90vw] max-w-[800px] lg:w-5/12 ${styling} ${
          loaded ? "block" : "hidden"
        }`}
        width="mx-auto"
        src={`https://www.youtube-nocookie.com/embed/${embedId}`}
        title={title}
        allow="web-share"
        onLoad={() => setLoaded(true)}
        allowFullScreen
      ></iframe>
    </div>
  );
}
