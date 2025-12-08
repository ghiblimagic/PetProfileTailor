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
      <section className="max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 items-center mx-auto justify-items-center ">
        <div className="text-left ml-8 mt-2 w-64">
          <div className="text-center w-32">
            <Link href="/">
              <Image
                src="/icon.png"
                width="40"
                height="40"
                priority
                unoptimized
                className="mx-auto"
                style={{
                  objectPosition: "center",
                  objectFit: "scale-down",
                }}
                alt=""
              />
              <span
                className="text-lg font-extrabold text-yellow-300 
                                    
                                     hover:text-subtleWhite text-center"
              >
                {" "}
                HomewardTails
              </span>
            </Link>
          </div>
          <p className="max-w-56 text-sm">
            {" "}
            Improving adoption rates through community!
          </p>
        </div>

        {/* ************* FIND ********* */}
        <div className="mt-2 w-56">
          <h7 className="font-extrabold text-base"> Find </h7>
          <ul>
            <FooterLink href="/fetchnames">Names </FooterLink>
            <FooterLink href="/fetchname">A Name </FooterLink>
            <FooterLink href="/fetchdescriptions">Descriptions </FooterLink>
          </ul>
        </div>

        {/* ************* ADD ********* */}

        <div className="mt-2 w-56">
          <h7 className="font-extrabold text-base"> Add </h7>
          <ul>
            <FooterLink href="/addnames">Names </FooterLink>
            <FooterLink href="/adddescriptions">Descriptions </FooterLink>
          </ul>
        </div>

        {/* ************* Contact ********* */}
        <div className="mt-2 w-56">
          <h7 className="font-extrabold text-base">Contact</h7>
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
          <h7 className="font-extrabold text-base">Credits</h7>
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
