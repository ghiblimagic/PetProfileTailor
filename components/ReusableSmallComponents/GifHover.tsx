/**
 * Image that swaps to GIF on hover.
 * Notes: docs/notes/components/reusable-small-components.md
 */
"use client";

import { useState } from "react";
import Image from "next/image";

export type GifHoverProps = {
  gifSrc: string;
  stillImageSrc: string;
  className?: string;
  layout?: string;
  width?: number;
  height?: number;
  divStyling?: string;
  alt?: string;
};

export default function GifHover({
  gifSrc,
  stillImageSrc,
  className,
  layout,
  width,
  height,
  divStyling,
  alt,
}: GifHoverProps) {
  const [hover, setHover] = useState(false);

  return (
    <div className={divStyling}>
      <Image
        src={hover ? gifSrc : stillImageSrc}
        layout={!layout ? "fill" : layout}
        alt={!alt ? "" : alt}
        className={className}
        width={width}
        height={height}
        unoptimized
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />
    </div>
  );
}
