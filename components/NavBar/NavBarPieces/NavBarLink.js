"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NavBarLink(props) {
  const router = useRouter();
  const isActive = router.pathname === props.href;
  // Use the built-in useRouter hook in Next.js to determine whether the link is going back to the current page or somewhere else.
  const href = router.pathname === props.href ? "#main" : props.href;
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
        href={href}
        aria-current={isActive}
      >
        {props.children}
      </Link>
    </li>
  );
}
