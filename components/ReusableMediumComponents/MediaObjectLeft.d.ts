import type { ReactElement } from "react";

export type MediaObjectLeftProps = {
  image: string;
  listOfText: string[];
  buttonText: string;
  buttonTextLink: string;
  alttext: string;
  imgwidth: string | number;
  imgheight: string | number;
  buttonStyle?: string;
};

declare function MediaObjectLeft(props: MediaObjectLeftProps): ReactElement;

export default MediaObjectLeft;
