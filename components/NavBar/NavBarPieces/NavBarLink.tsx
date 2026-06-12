/**
 * Nav list item with active-page a11y (skip redundant link → #main).
 * Notes: docs/notes/components/navbar.md
 */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type NavBarLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  className?: string;
  children: ReactNode;
};

export default function NavBarLink({ href, children }: NavBarLinkProps) {
  const pathname = usePathname();
  const hrefString = typeof href === "string" ? href : (href.pathname ?? "");
  const isActive = pathname === hrefString;
  // Use pathname to determine whether the link is going back to the current page or somewhere else.
  const linkHref = isActive ? "#main" : href;
  // If the link is going to the current page, change its `href` property to go to the `#main` element. That way, instead of being redundant, this link can act similarly to our `SkipLink` component!

  //https://prismic.io/blog/nextjs-accessibility

  return (
    <li
      className="inline-flex px-2 py-2 text-sm font-bold text-subtleWhite 
 
            
   
    hover:border-b-4
    hover:border-subtleWhite
    
    focus:outline-none 
    focus-visible:ring-2 
    focus-visible:ring-white 
    focus-visible:ring-opacity-75"
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
