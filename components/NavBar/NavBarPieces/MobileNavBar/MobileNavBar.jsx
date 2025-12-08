"use client";

import React from "react";
import { Menu, MenuItem, MenuItems, MenuButton } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Link from "next/link";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export default function MobileNavBar() {
  return (
    <Menu
      as="div"
      className="inline-block w-full lg:hidden z-50 "
    >
      {/* Hamburger Button */}
      <MenuButton className="inline-flex justify-center p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-subtleWhite">
        <FontAwesomeIcon
          icon={faBars}
          className="text-xl text-violet-100 hover:text-yellow-300"
        />
      </MenuButton>

      {/* Menu Items */}
      <MenuItems className="absolute  mt-2 w-full  rounded-md bg-primary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y -ml-2  divide-gray-100">
        {/* -ml-2 has it go flush to the left, w-[calc(100vw-17px)] leaves room for the scrollbar on the right */}
        <div className="flex flex-col py-1">
          <MenuItem>
            {({ focus }) => (
              <Link
                href="/"
                className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                  focus ? "bg-white/10 text-subtleWhite" : ""
                }`}
              >
                Home
              </Link>
            )}
          </MenuItem>

          <MenuItem disabled>
            <button
              className="text-subtleWhite w-full text-left rounded-md px-2 py-2 text-sm font-bold bg-secondary cursor-not-allowed ml-2"
              disabled
            >
              Fetch/Find
            </button>
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <Link
                href="/fetchnames"
                className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                  focus ? "bg-white/10 text-subtleWhite" : ""
                }`}
              >
                Names
              </Link>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <Link
                href="/fetchname"
                className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                  focus ? "bg-white/10 text-subtleWhite" : ""
                }`}
              >
                A Name
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <Link
                href="/fetchdescriptions"
                className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                  focus ? "bg-white/10 text-subtleWhite" : ""
                }`}
              >
                Descriptions
              </Link>
            )}
          </MenuItem>

          <MenuItem disabled>
            <button
              className="text-subtleWhite w-full text-left rounded-md px-2 py-2 text-sm font-bold bg-secondary cursor-not-allowed ml-2"
              disabled
            >
              Add
            </button>
          </MenuItem>

          <MenuItem>
            {/* // MenuItem demands the content to be an <a> tag, but Next.js 13's Link does not render a real <a> so focus styling and click handling breaks */}

            {/* legacyBehavior → lets you explicitly hand headless UI the a tag it demands to see. Allows us to type out an a child tag. This uses an older pattern of Link, 
            next.js 13+ will yell at you if you do this without legacy behavior */}

            {/* needed in order to pass the href to Link's child a tag */}

            {({ focus }) => (
              <Link
                href="/addnames"
                className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                  focus ? "bg-white/10 text-subtleWhite" : ""
                }`}
              >
                {" "}
                Names{" "}
              </Link>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <Link
                href="/adddescriptions"
                className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                  focus ? "bg-white/10 text-subtleWhite" : ""
                }`}
              >
                Descriptions
              </Link>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}
