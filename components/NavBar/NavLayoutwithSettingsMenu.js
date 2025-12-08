"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
// //Special jsx code that allows us to build links. Allows us to keep everything on a single page (makes it a SPA), rather than using a href="page link", which would make us lose any state and require that we get a new file sent from the server

import React, { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import "react-toastify/dist/ReactToastify.css";
import MobileNavBar from "./NavBarPieces/MobileNavBar/MobileNavBar";
import NavBarNames from "./NavBarPieces/DesktopNavBar/NavBarNames";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import "@fortawesome/fontawesome-svg-core/styles.css";

import NotificationsButton from "@components/Notifications/NotificationsButton";

import { forwardRef } from "react";
import ProfileImage from "@components/ReusableSmallComponents/ProfileImage";
import LinkButton from "@components/ReusableSmallComponents/buttons/LinkButton";

export default function NavLayoutwithSettingsMenu() {
  // Use client-side session for reactive updates
  const { data: session, status } = useSession();
  const logoutClickHandler = () => {
    signOut({ callbackUrl: "/login" });
  };
  // Only use serverSession while clientSession is "loading"

  const MenuItemsStyling =
    "absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-primary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none";

  const menuItemStyling = function (focus) {
    return `block px-4 py-2 text-sm text-gray-300 ${
      focus ? "bg-white/10 text-white" : ""
    }`;
  };

  let userName = "";
  let profileImageLink = "";
  let signedInUsersId = "";

  if (session?.user) {
    userName = session.user.name || "";
    profileImageLink = session.user.profileImage || "";
    signedInUsersId = session.user.id || "";
  }

  useEffect(() => {
    // console.log("nav check", status, session);
    if (status === "authenticated" && !session?.user) {
      // waits until the session has been fetched (authenticated)
      signOut(); // ensures cookies cleared if token nuked, aka for a banner user
    }
  }, [session]);

  return (
    <>
      <div className="flex flex-col justify-between bg-primary">
        <header className="my-1">
          <nav
            className="flex h-12 items-center pl-2 justify-between  bg-primary"
            role="navigation"
            aria-label="Primary navigation"
          >
            {/* HAMBURGER MENU BUTTON */}

            <MobileNavBar />

            <LinkButton
              className="text-center gap-2 text-lg font-extrabold text-yellow-300 
             hidden lg:flex mx-auto ml-2 hover:text-subtleWhite"
              href="/"
              text="HomewardTails"
              icon={
                <Image
                  src="/icon.png"
                  width="28"
                  height="28"
                  priority
                  unoptimized
                  style={{ objectPosition: "center", objectFit: "scale-down" }}
                  alt=""
                />
              }
            />

            <NavBarNames />
            {userName != "" && <NotificationsButton />}

            <div className="mr-2">
              {userName != "" ? (
                <Menu
                  as="div"
                  className="relative inline-block text-left z-30"
                >
                  <MenuButton
                    className="inline-flex items-center justify-center 
            text-subtleWhite
             hover:border-b-4 hover:border-blue-100
             focus:outline-none focus-visible:ring-2 
             focus-visible:ring-white focus-visible:ring-opacity-75
             hover:text-subtleWhite"
                  >
                    <ProfileImage
                      divStyling={"ml-3 h-8 w-8 relative"}
                      profileImage={profileImageLink}
                      className="rounded-full inline relative"
                    />

                    <ChevronDownIcon
                      className="ml-1 h-5 w-5 text-violet-200 hover:text-amber-300"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Open profile menu</span>
                  </MenuButton>

                  <MenuItems className={MenuItemsStyling}>
                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          href="/dashboard"
                          className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                            focus ? "bg-white/10 text-subtleWhite" : ""
                          }`}
                        >
                          Dashboard
                        </Link>
                      )}
                    </MenuItem>

                    {session.user.profileName && (
                      <MenuItem>
                        {({ focus }) => (
                          <Link
                            href={`${
                              process.env.NEXT_PUBLIC_BASE_FETCH_URL
                            }profile/${session.user.profileName.toLowerCase()}`}
                            className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                              focus ? "bg-white/10 text-subtleWhite" : ""
                            }`}
                          >
                            Profile
                          </Link>
                        )}
                      </MenuItem>
                    )}

                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          href={`/editsettings`}
                          className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                            focus ? "bg-white/10 text-subtleWhite" : ""
                          }`}
                        >
                          Settings
                        </Link>
                      )}
                    </MenuItem>

                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          href={`/contact`}
                          className={`flex items-center px-4 py-2 text-sm text-subtleWhite ${
                            focus ? "bg-white/10 text-subtleWhite" : ""
                          }`}
                        >
                          Contact
                        </Link>
                      )}
                    </MenuItem>

                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={logoutClickHandler}
                          className={`${menuItemStyling(
                            focus,
                          )} w-full text-left`}
                        >
                          Logout
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              ) : (
                <div className="flex gap-2">
                  <LinkButton
                    basic
                    href="/login"
                    text="login"
                    className="text-sm"
                  />
                  <LinkButton
                    defaultStyle
                    href="/register"
                    text="register"
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </nav>
        </header>
      </div>
    </>
  );
}
