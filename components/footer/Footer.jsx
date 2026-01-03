import React from "react";
import Image from "next/image";
import LinkButton from "../ReusableSmallComponents/buttons/LinkButton";
import FooterLink from "./FooterLink";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-subtleWhite text-sm py-4 px-4 bg-secondary border-t-2 border-violet-400 ">
      {/* we want the footer to be as large as the screen, while the content is max-w-7xl */}
      {/* **************** LOGO *************** */}
      <section className="max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start justify-items-start md:justify-items-center ml-2 md:mx-auto ">
        <div className="text-left  mt-2  ">
          <Link
            href="/"
            className="flex items-center h-[34px]"
          >
            <Image
              src="/icon.png"
              width="35"
              height="35"
              priority
              unoptimized
              className="inline-block"
              style={{
                objectPosition: "center",
                objectFit: "scale-down",
              }}
              alt=""
            />
            <span
              className="text-xl font-extrabold text-yellow-300 ml-2
                                    
                                     hover:text-subtleWhite"
            >
              {" "}
              HomewardTails
            </span>
          </Link>

          <p className="max-w-56 text-sm mt-3">
            {" "}
            Improving adoption rates through community!
          </p>
        </div>

        {/* ************* FIND ********* */}
        <div className="mt-2 w-56">
          <h7 className="font-extrabold text-base mb-3 inline-block"> Find </h7>
          <ul>
            <FooterLink href="/fetchnames">Names </FooterLink>
            <FooterLink href="/fetchname">A Name </FooterLink>
            <FooterLink href="/fetchdescriptions">Descriptions </FooterLink>
          </ul>
        </div>

        {/* ************* ADD ********* */}

        <div className="mt-2 w-56">
          <h7 className="font-extrabold text-base mb-3 inline-block"> Add </h7>
          <ul>
            <FooterLink href="/addnames">Names </FooterLink>
            <FooterLink href="/adddescriptions">Descriptions </FooterLink>
          </ul>
        </div>

        {/* ************* Contact ********* */}
        <div className="mt-2 w-56">
          <h7 className="font-extrabold text-base mb-3 inline-block">
            Reach Out
          </h7>
          <ul>
            <FooterLink href="/contact"> Contact </FooterLink>
            <a
              className="hover:underline hover:text-violet-300 block mt-1"
              href="https://bsky.app/profile/homewardtails.bsky.social"
            >
              {" "}
              Bluesky{" "}
            </a>
          </ul>
        </div>

        <div className="flex flex-col mt-2 w-56">
          <h7 className="font-extrabold text-base mb-3 inline-block">
            Credits
          </h7>
          <small>
            <a
              className="hover:underline hover:text-violet-300 block mt-1 text-sm"
              href="https://www.freepik.com/author/freepik/icons/kawaii-flat_45#from_element=resource_detail"
            >
              Default icons by Freepik
            </a>
          </small>
          <small>
            <a
              className="hover:underline hover:text-violet-300 block mt-1 text-sm"
              href="https://thenounproject.com/browse/icons/term/thank-you/"
            >
              Thanks icon by Arfan Haq
            </a>
          </small>
        </div>
      </section>
    </footer>
  );
}
