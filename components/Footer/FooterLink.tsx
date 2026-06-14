/**
 * Footer nav link with active-page a11y (redundant link → #main).
 * Notes: docs/notes/components/footer.md
 */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type FooterLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
};

export default function FooterLink({ href, children }: FooterLinkProps) {
  const pathname = usePathname();
  const hrefString = typeof href === "string" ? href : (href.pathname ?? "");
  const isActive = pathname === hrefString;
  const linkHref = isActive ? "#main" : href;

  return (
    <li
      className=" 
    hover:text-violet-300
    hover:underline
    focus:outline-none 
    focus-visible:ring-2 
    focus-visible:ring-white 
    focus-visible:ring-opacity-75 mt-1"
    >
      {isActive && <span className="visually-hidden">Current page: </span>}
      <Link
        href={linkHref}
        aria-current={isActive ? "page" : undefined}
      >
        {children}
      </Link>
    </li>
  );
}
