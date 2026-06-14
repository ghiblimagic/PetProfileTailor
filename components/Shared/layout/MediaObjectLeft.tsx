/**
 * Landing/marketing block: image left, bullet list + link button right.
 * Notes: docs/notes/components/media-object.md
 */
import ListWithPawPrintIcon from "@components/Shared/lists/ListWithPawPrintIcon";
import LinkButton from "@components/Shared/actions/LinkButton";
import Image from "next/image";
import type { ComponentProps } from "react";

export type MediaObjectLeftProps = {
  image: string;
  listOfText: string[];
  buttonText: string;
  buttonTextLink: ComponentProps<typeof LinkButton>["href"];
  alttext: string;
  imgwidth: string | number;
  imgheight: string | number;
  buttonStyle?: string;
};

export default function MediaObjectLeft({
  image,
  listOfText,
  buttonText,
  buttonTextLink,
  buttonStyle,
  alttext,
  imgwidth,
  imgheight,
}: MediaObjectLeftProps) {
  return (
    <div className="flex justify-center my-6 flex-col md:flex-row sm:ml-2">
      <div className="self-center ">
        <Image
          className=""
          src={image}
          width={Number(imgwidth)}
          height={Number(imgheight)}
          alt={alttext}
          style={{
            maxWidth: "100%",
            width: "auto",
            height: "auto",
          }}
        />
      </div>
      <div className="max-w-1/2  mr-8 self-center ">
        <ul className="text-base md:text-lg text-white pb-8 pl-4">
          {listOfText.map((sentence) => (
            <ListWithPawPrintIcon
              text={sentence}
              key={sentence}
            />
          ))}
        </ul>

        <div className="flex items-center max-w-2xl ml-4">
          {buttonText && buttonStyle === "subtle" ? (
            <LinkButton
              href={buttonTextLink}
              text={buttonText}
              subtle
            />
          ) : (
            <LinkButton
              href={buttonTextLink}
              text={buttonText}
              defaultStyle
            />
          )}
        </div>
      </div>
    </div>
  );
}
