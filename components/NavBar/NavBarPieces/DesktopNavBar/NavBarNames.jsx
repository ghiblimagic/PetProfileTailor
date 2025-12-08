"use client";

import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import AddItemsDropDownMenu from "./AddItemsDropDownMenu";

import "@fortawesome/fontawesome-svg-core/styles.css";
import NavBarLink from "../NavBarLink";
import { useSession } from "next-auth/react";
import AdminDropdownMenu from "@components/NavBar/NavBarPieces/DesktopNavBar/AdminDropdownMenu";
import FetchDropDownMenu from "./FetchDropDownMenu";

//onclick wrapped in spans due to this error https://github.com/vercel/next.js/discussions/39212

// HERE
const NavBarNames = () => {
  const { data: session } = useSession();
  const { role, status, id: signedInUsersId } = session?.user || {};
  const isAdmin = role === "admin" && status === "active";

  return (
    <div className="divWhichHasBothMenus w-full">
      {/* DESKTOP MENU */}

      <section className="hidden lg:flex desktop-menu ">
        <ul className="flex justify-around w-full max-w-3xl mx-auto ">
          {/* w-full is needed for it to stretch, and then max-w-5xl limits it */}
          <NavBarLink
            href="/"
            className=""
          >
            Home
          </NavBarLink>

          <FetchDropDownMenu />
          <AddItemsDropDownMenu />

          {isAdmin && <AdminDropdownMenu />}
        </ul>
      </section>
    </div>
  );
};

export default NavBarNames;
