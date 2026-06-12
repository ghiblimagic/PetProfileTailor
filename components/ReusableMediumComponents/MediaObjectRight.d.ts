import type { ReactElement } from "react";

export type MediaObjectRightProps = {
  image: string;
  listOfText: string[];
  buttonText: string;
  buttonTextLink: string;
  alttext: string;
  imgwidth: string | number;
  imgheight: string | number;
  credit?: string;
  creditLink?: string;
  buttonStyle?: string;
};

declare function MediaObjectRight(
  props: MediaObjectRightProps,
): ReactElement;

export default MediaObjectRight;
