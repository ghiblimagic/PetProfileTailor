/**
 * Landing/marketing block: bullet list + link button left, image right.
 * Notes: docs/notes/components/media-object.md
 */
import LinkButton from "@components/Shared/actions/LinkButton";
import ListWithPawPrintIcon from "@components/Shared/lists/ListWithPawPrintIcon";
import Image from "next/image";
import type { ComponentProps } from "react";
import {
  mediaObjectLinkButtonFlags,
  type MediaObjectButtonStyle,
} from "./mediaObjectButtonStyle";

export type MediaObjectRightProps = {
  image: string;
  listOfText: string[];
  buttonText: string;
  buttonTextLink: ComponentProps<typeof LinkButton>["href"];
  alttext: string;
  imgwidth: string | number;
  imgheight: string | number;
  credit?: string;
  creditLink?: string;
  buttonStyle?: MediaObjectButtonStyle;
};

export default function MediaObjectRight({
  image,
  listOfText,
  buttonText,
  buttonTextLink,
  alttext,
  imgwidth,
  imgheight,
  credit,
  creditLink,
  buttonStyle,
}: MediaObjectRightProps) {
  return (
    <div className="flex justify-center py-10 flex-col md:flex-row sm:ml-2">
      <div className="max-w-md ml-4 mr-8 self-center">
        <ul className="text-base md:text-lg text-white pb-8">
          {listOfText.map((sentence) => (
            <ListWithPawPrintIcon text={sentence} key={sentence} />
          ))}
        </ul>

        <div className="flex justify-center mb-4">
          <LinkButton
            href={buttonTextLink}
            text={buttonText}
            {...mediaObjectLinkButtonFlags(buttonStyle)}
          />
        </div>
      </div>
      <div className="self-center w-80 ml-8">
        <Image
          className=""
          width={Number(imgwidth)}
          height={Number(imgheight)}
          src={image}
          alt={alttext}
          sizes="100vw"
          style={{
            maxWidth: "100%",
            width: "auto",
            height: "auto",
          }}
        />

        {credit && (
          <small className="text-subtleWhite">
            {credit}
            <a href={creditLink}> - clickable link </a>
          </small>
        )}
      </div>
    </div>
  );
}
