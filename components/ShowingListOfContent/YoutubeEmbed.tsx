/**
 * Lazy YouTube iframe with close button (landing page videos).
 * Notes: docs/notes/components/showing-list-of-content/youtube-and-social-lists.md
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import LoadingSpinner from "../Shared/ui/LoadingSpinner";

export type YoutubeEmbedProps = {
  text: string;
  embedId: string;
  posterSrc: string;
  posterAlt: string;
  styling?: string;
  title: string;
  showVideoFunction: (open: boolean) => void;
};

export default function YoutubeEmbed({
  text,
  embedId,
  posterSrc,
  posterAlt,
  styling = "",
  title,
  showVideoFunction,
}: YoutubeEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  return (
    <div className="relative mt-4 mx-auto max-w-[850px] px-4 sm:px-8 pt-8 pb-12 text-center border-2 rounded-2xl bg-secondary border-subtleBorder motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 motion-safe:duration-300">
      <h2 className="text-white font-heading text-lg sm:text-xl font-semibold mb-4 px-8">
        {`Video of a ${text} pet bio in action!`}
      </h2>

      <GeneralButton
        text="✕"
        plain
        ariaLabel="Close video"
        className="absolute top-3 right-3 !m-0 !p-0 w-8 h-8 flex items-center justify-center !rounded-full text-lg"
        onClick={() => showVideoFunction(false)}
        type="button"
      />

      {/* Fixed-size stage: aspect-video + w-full reserve the same box for the poster,
          loading spinner, and iframe, so the panel never collapses/grows between states. */}
      <div
        className={`relative mx-auto aspect-video w-full rounded-lg border border-subtleBorder overflow-hidden ${styling}`}
      >
        {!started && (
          <button
            type="button"
            onClick={() => setStarted(true)}
            aria-label={`Play video: ${title}`}
            className="absolute inset-0 block w-full h-full"
          >
            <Image
              src={
                posterFailed
                  ? `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`
                  : posterSrc
              }
              alt={posterAlt}
              fill
              unoptimized
              style={{ objectFit: "cover" }}
              onError={() => setPosterFailed(true)}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-black/60">
                <Play size={28} className="text-white ml-1" fill="white" />
              </span>
            </span>
          </button>
        )}

        {started && (
          <>
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <LoadingSpinner />
              </div>
            )}

            <iframe
              className={`absolute inset-0 w-full h-full ${
                loaded ? "block" : "hidden"
              }`}
              src={`https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1`}
              title={title}
              allow="autoplay; web-share"
              onLoad={() => setLoaded(true)}
              allowFullScreen
            ></iframe>
          </>
        )}
      </div>
    </div>
  );
}
