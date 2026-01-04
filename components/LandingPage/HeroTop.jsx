"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Image from "next/image";
import {
  faBullseye,
  faFaceGrinWink,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotions";

const HeroTop = ({
  updateImpactfulState,
  updateFunState,
  updateTailorState,
}) => {
  const [hover, setHover] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleMouseEnterForImage = () => {
    setHover(true);
  };

  const handleMouseLeaveForImage = () => {
    setHover(false);
  };

  const imageSrc =
    prefersReducedMotion || hover ? "/pugStillImage.png" : "/pugs.webp";

  return (
    <div
      className="hero min-h-fit font-serif 
  mx-auto overflow-hidden"
      onMouseEnter={handleMouseEnterForImage}
      onMouseLeave={handleMouseLeaveForImage}
    >
      <div className="hero-overlay  relative  z-10 opacity-20 ">
        <Image
          src={imageSrc}
          fill
          priority
          unoptimized
          className="opacity-80"
          style={{ objectPosition: "center", objectFit: "cover" }}
          alt=""
        />
      </div>
      <div className="hero-content text-center text-neutral-content mb-10 z-20  ">
        {/* hero-content is from daisy ui */}
        <div className="max-w-xl text-subtleWhite">
          <h1 className="mb-5 text-3xl md:text-4xl text-yellow-300 font-black">
            Welcome to <br /> Homeward Tails!
          </h1>
          <p className="mb-5 text-base md:text-xl">
            Naming your new pet or creating profiles for adoptable pets can feel
            ruff! We&apos;ve been there! And we&apos;re here to help.
          </p>
          <p className="mb-8 text-base md:text-xl">
            Homeward Tails is a community created database of names and
            descriptions that helps you write creative &quot;tales&quot; to get
            pets home! It&apos;s easier than ever to create pet bios that are:
          </p>

          <section className="flex justify-center gap-3 flex-wrap">
            <div className="flex-1">
              <FontAwesomeIcon
                icon={faFaceGrinWink}
                className="text-2xl fa-bounce"
                color="white"
              />

              <button
                className="btn btn-primary w-full mt-2 shadow-lg shadow-secondary bg-subtleBackground text-white hover:text-white border-b-4 border-subtleWhite hover:border-blue-700 hover:bg-blue-500 font-black text-sm h-10 rounded-full tracking-widest"
                onClick={updateFunState}
              >
                Fun
              </button>
            </div>
            <div className="flex-1">
              <FontAwesomeIcon
                icon={faBullseye}
                className="text-2xl"
                color="white"
              />

              <button
                className="btn btn-primary w-full mt-2 shadow-lg shadow-secondary bg-subtleBackground text-white hover:text-white border-b-4 border-subtleWhite hover:border-blue-700 hover:bg-blue-500 font-black text-sm  h-10 rounded-full tracking-widest focus:ring-white"
                onClick={updateImpactfulState}
              >
                Impactful
              </button>
            </div>

            <div className="flex-1">
              <FontAwesomeIcon
                icon={faUserTie}
                className="text-2xl"
                color="white"
              />
              <button
                className="btn btn-primary w-full mt-2 shadow-lg shadow-secondary bg-subtleBackground text-white hover:text-white border-b-4 border-subtleWhite hover:border-blue-700 hover:bg-blue-500 font-black text-sm  h-10 rounded-full tracking-widest px-0"
                onClick={updateTailorState}
              >
                Fitting
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HeroTop;
