"use client";

// need to mark it as useClient, because of the way Next passes errors to this component Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". <... buildId=... assetPrefix="" initialCanonicalUrl=... initialTree=... initialHead=... globalErrorComponent={function} children=...>
import Link from "next/link";
import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import ListWithPawPrintIcon from "@components/ReusableSmallComponents/ListWithPawPrintIcon";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faEnvelope,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import PawPrintIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/PawPrintIcon";
import Image from "next/image";

export default function About() {
  return (
    <div>
      <PageTitleWithImages title="About" />

      <section className="text-subtleWhite ">
        <h2 className="text-xl md:text-3xl font-semibold py-4 text-center bg-secondary text-subtleWhite   border-y-2 border-subtleWhite my-10">
          {" "}
          About Homeward Tails
        </h2>
        <p className="my-4">
          {" "}
          HomewardTails was inspired by working as an adoption counselor for 5
          years.{" "}
        </p>

        <h3 className="font-semibold"> The problem: </h3>
        <p className="my-4 ml-6">
          {" "}
          To get animals adopted a memorable name and adoption profile is vital.
          However, adoption profiles are often written early in the morning
          creativity is at an all time low. So it&apos;s tempting to just name
          everyone bob and bobbett. Additionally, after animal 143 or so you
          start running out of ideas.{" "}
        </p>

        <h3 className="font-semibold"> The solution: </h3>
        <p className="my-4 ml-6">
          {" "}
          Allow everyday people to help adoption counselors by submitting
          creative names and descriptions.
        </p>
      </section>

      <section className="text-subtleWhite">
        <h2 className="text-xl md:text-3xl font-semibold py-4 text-center bg-secondary text-subtleWhite   border-y-2 border-subtleWhite my-10">
          {" "}
          About the Creator{" "}
        </h2>
        {/*     section */}
        <div className="relative w-[240px] h-[240px] mx-auto">
          <Image
            src="/janet-spellman.webp"
            fill
            priority
            className=""
            style={{ objectPosition: "center", objectFit: "cover" }}
            alt="A picture of janet spellman smiling."
          />
        </div>

        <p className="my-4"> Hello there, my name is Janet Spellman.</p>

        <p className="my-4">
          {" "}
          Even after entering the tech field, I have not forgotten my five years
          working in animal shelters as an adoption counselor.
        </p>

        <p className="my-4">
          I first considered a tech career after building an automated audiobook
          program to reduce stress levels in shelter pets and after seeing a
          notable reduction in noise levels, I was inspired to pursue it
          seriously. Seeing that kind of impact in a field that has historically
          lagged in technology deepened my interest.
        </p>

        <p className="my-4">
          {" "}
          I pivoted into tech by completing a 30-week MERN stack training
          program through the 100Devs agency, and have since taken on freelance
          projects through my own practice,{" "}
          <a
            className="underline"
            href="www.janetspellman.com"
          >
            Spellman’s Consulting.
          </a>{" "}
        </p>

        <h3 className="text-xl md:text-3xl font-semibold py-4 text-center bg-secondary text-subtleWhite   border-y-2 border-subtleWhite my-10">
          {" "}
          About the CEO (Cat Engineering Officer){" "}
        </h3>
        <div className="relative w-[240px] h-[240px] mx-auto">
          <Image
            src="/ember.png"
            fill
            priority
            className=""
            style={{ objectPosition: "center", objectFit: "cover" }}
            alt="a black and orange tortie cat with a white chest"
          />
        </div>

        <p className="mt-10 mb-4">
          {" "}
          Ember is a 9 year old domestic shorthair who makes up for her lack of
          coding skills with her motivational skills.
        </p>

        <p className="mt-4 mb-10">
          {" "}
          She takes long, company sponsored vacations in her two catios.
        </p>

        <section className="flex flex-col gap-4 md:gap-0 md:flex-row justify-between">
          <div className="relative w-[240px] h-[240px] mx-auto">
            <Image
              src="/catio.jpg"
              fill
              priority
              className=""
              style={{ objectPosition: "center", objectFit: "cover" }}
              alt="a catio made of metal dog kennels and wooden shelves, with cats sitting on the shelves."
            />
          </div>

          <div className="relative w-[240px] h-[240px] mx-auto">
            <Image
              src="/catio-2.jpg"
              fill
              priority
              className=""
              style={{ objectPosition: "center", objectFit: "cover" }}
              alt="a small catio made out of a dog kennel."
            />
          </div>
        </section>

        <section>
          <h3 className="text-xl md:text-3xl font-semibold py-4 text-center bg-secondary text-subtleWhite my-10  border-y-2 border-subtleWhite">
            {" "}
            Get in contact
          </h3>

          <ul className="flex flex-col gap-4 mb-10">
            <li className="block">
              <FontAwesomeIcon
                icon={faBriefcase}
                className="mr-2"
              />
              <a
                href="https://janetspellman.com"
                className="underline"
              >
                Porfolio
              </a>
            </li>

            <li className="block">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="mr-2"
              />
              <a
                href="mailto:homewardtailsdev@gmail.com"
                className="underline"
              >
                Email
              </a>
            </li>

            <li className="block">
              <a
                href="https://x.com/ghiblimagicdev"
                className="underline"
              >
                <FontAwesomeIcon
                  icon={faMessage}
                  className="mr-2"
                />
                Twitter/X
              </a>
            </li>

            <li className="block">
              <a
                href="https://bsky.app/profile/ghiblimagic.bsky.social"
                className="underline"
              >
                <FontAwesomeIcon
                  icon={faMessage}
                  className="mr-2"
                />
                Bluesky
              </a>
            </li>
          </ul>
        </section>
      </section>
    </div>
  );
}
