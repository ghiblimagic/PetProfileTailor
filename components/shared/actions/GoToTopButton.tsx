/**
 * Fixed scroll-to-top control — listens on body (flex layout scroll container).
 * Notes: docs/notes/components/reusable-buttons.md
 */
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import GeneralButton from "@/components/shared/actions/GeneralButton";

export type GoToTopButtonProps = {
  /** Scroll target offset (px) — passed to `scrollTo({ top })` */
  top?: number | string;
};

export default function GoToTopButton({ top = "280" }: GoToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  // show button only after scrolling down a bit
  useEffect(() => {
    // window wasn't working i Had to directly target the scroll element I saw when inspecting the page (body)
    // why?
    // In a normal page, the document (html + body) don't have scrollTop — you'd use window.scrollY
    // In this Next.js layout, because of the h-full flex flex-col setup, body itself has become the scroll container. That's why body.scrollTop works, while window.scrollY doesn't update.
    const scrollContainer = document.querySelector("body");
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsVisible(scrollContainer.scrollTop > 300); // show after 300px scroll
    };

    // set initial visibility right after mount
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector("body");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: typeof top === "string" ? Number(top) : top,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {isVisible && (
        <GeneralButton
          ariaLabel="Go to top"
          onClick={scrollToTop}
          className="fixed bottom-16 right-6 py-3 px-5 rounded-full transition"
        >
          <FontAwesomeIcon
            size="xl"
            icon={faArrowUp}
          />
        </GeneralButton>
      )}
    </>
  );
}
