"use client";

import type { ComponentType } from "react";
import LinkButton from "@components/ReusableSmallComponents/buttons/LinkButton";

const ShareLinkButton = LinkButton as ComponentType<{
  href: string;
  className?: string;
  text: string;
}>;
import {
  EmailShareButton,
  EmailIcon,
  FacebookShareButton,
  FacebookIcon,
  RedditShareButton,
  RedditIcon,
  TumblrShareButton,
  TumblrIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
} from "next-share";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export type SharingOptionsBarProps = {
  linkToShare: string;
  localLink: string;
};

export default function SharingOptionsBar({
  linkToShare,
  localLink,
}: SharingOptionsBarProps) {
  const encodedLink = linkToShare.split(" ").join("%20");

  return (
    <section className="flex sm:flex-row flex-wrap justify-evenly items-center">
      <div className="w-full justify-evenly flex flex-col items-center gap-4 sm:gap-0 sm:flex-row mb-6 sm:mb-4">
        <button
          type="button"
          className="bg-subtleWhite px-4 py-2 
                  rounded-full
                  text-secondary
                  font-semibold
                  shadow-md
                  shadow-secondary
                  hover:text-violet-200
                  hover:bg-secondary inline-block max-w-[160px]"
          onClick={() => {
            void navigator.clipboard.writeText(encodedLink);
            toast.success("link saved to clipboard");
          }}
        >
          Copy link
        </button>

        <ShareLinkButton
          text="Go to link"
          href={localLink}
          className="bg-subtleWhite px-4 py-2
                  rounded-full
                  text-secondary
                  font-semibold
                  shadow-md
                  shadow-secondary
                  hover:text-violet-200
                  hover:bg-secondary max-w-[160px]"
        />
      </div>

      <div className="grid grid-cols-3 gap-6 sm:gap-0 sm:grid-cols-6 justify-items-center items-center w-full">
        <div className="drop-shadow-lg hover:bg-subtleWhite hover:rounded-full hover:items-center flex active:bg-violet-700 ring-offset-2 ring-offset-indigo-600 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:bg-indigo-800">
          <EmailShareButton
            url={encodedLink}
            subject="Link from Pet Profile Tailor"
          >
            <EmailIcon
              size={40}
              round
            />
          </EmailShareButton>
        </div>

        <div className="drop-shadow-lg hover:bg-subtleWhite hover:rounded-full hover:items-center flex active:bg-violet-700 focus-within:ring-2 focus-within:ring-indigo-200 ring-offset-2 ring-offset-indigo-600 focus-within:bg-indigo-800">
          <FacebookShareButton
            url={encodedLink}
            hashtag="#tailoredPetNames"
          >
            <span className="focus:ring focus:ring-violet-300">
              <FacebookIcon
                size={40}
                round
              />
            </span>
          </FacebookShareButton>
        </div>

        <div className="drop-shadow-lg hover:bg-subtleWhite hover:rounded-full hover:items-center flex active:bg-violet-700 focus-within:ring-2 focus-within:ring-indigo-200 ring-offset-2 ring-offset-indigo-600 focus-within:bg-indigo-800">
          <TwitterShareButton url={encodedLink}>
            <TwitterIcon
              size={40}
              round
            />
          </TwitterShareButton>
        </div>

        <div className="drop-shadow-lg hover:bg-subtleWhite hover:rounded-full hover:items-center flex active:bg-violet-700 focus-within:ring-2 focus-within:ring-indigo-200 ring-offset-2 ring-offset-indigo-600 focus-within:bg-indigo-800">
          <RedditShareButton
            url={encodedLink}
            title={encodedLink}
          >
            <RedditIcon
              size={40}
              round
            />
          </RedditShareButton>
        </div>

        <div className="drop-shadow-lg hover:bg-subtleWhite hover:rounded-full hover:items-center flex active:bg-violet-700 focus-within:ring-2 focus-within:ring-indigo-200 ring-offset-2 ring-offset-indigo-600 focus-within:bg-indigo-800">
          <TumblrShareButton
            url={encodedLink}
            title={encodedLink}
          >
            <TumblrIcon
              size={40}
              round
            />
          </TumblrShareButton>
        </div>

        <div className="drop-shadow-lg hover:bg-subtleWhite hover:rounded-full hover:items-center flex active:bg-violet-700 ring-offset-2 ring-offset-indigo-600 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:bg-indigo-800">
          <WhatsappShareButton
            url={encodedLink}
            title={encodedLink}
            separator=":: "
          >
            <WhatsappIcon
              size={40}
              round
            />
          </WhatsappShareButton>
        </div>
      </div>
    </section>
  );
}
