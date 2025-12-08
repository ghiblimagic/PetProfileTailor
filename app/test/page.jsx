"use client";

// need to mark it as useClient, because of the way Next passes errors to this component Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". <... buildId=... assetPrefix="" initialCanonicalUrl=... initialTree=... initialHead=... globalErrorComponent={function} children=...>
import Link from "next/link";
import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import ListWithPawPrintIcon from "@components/ReusableSmallComponents/ListWithPawPrintIcon";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMessage } from "@fortawesome/free-solid-svg-icons";
import PawPrintIcon from "@components/ReusableSmallComponents/iconsOrSvgImages/PawPrintIcon";
import Image from "next/image";

export default function CustomError() {
  return (
    <>
      <PageTitleWithImages
        title="500"
        title2="Server Error"
      />
      <p className="text-center text-white">
        Ruh-roh! Unfortunately our server got distracted hunting a
        &quot;mouse&quot; 😿.
      </p>

      <div className="relative w-[240px] h-[240px] mx-auto">
        <Image
          src="/icon.png"
          fill
          priority
          className=""
          style={{ objectPosition: "center", objectFit: "scale-down" }}
          alt=""
        />
      </div>

      <ul className="text-center text-white bg-secondary max-w-4xl mx-auto h-fit pt-4 sm:px-2">
        <ListWithPawPrintIcon
          className="justify-center"
          text=" You can try to reload the page to see if the error resolves"
        />

        <li>
          <h4>
            <PawPrintIcon /> Or contact me directly:
          </h4>

          <span className="block">
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
          </span>

          <span className="block">
            <a href="https://twitter.com/Janetthedev">
              <FontAwesomeIcon
                icon={faMessage}
                className="mr-2"
              />
              Twitter
            </a>
          </span>
        </li>

        <ListWithPawPrintIcon
          className="mb-6 justify-center"
          text="Or return to our login page"
        />
        <li className="h-16">
          <Link
            href="/login"
            className=" bg-yellow-300 text-secondary font-bold py-3 px-4 border-b-4 border-yellow-100    
                   shadow-lg shadow-stone-900/70 rounded-2xl
                   hover:bg-blue-500                            hover:text-white                            hover:border-blue-700 text-base 
                   "
          >
            Login
          </Link>
        </li>
      </ul>
    </>
  );
}
