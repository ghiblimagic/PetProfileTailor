"use client";

import React from "react";
import PointSystemList from "@components/Ranking/PointSystemList";
import { useSession } from "next-auth/react";
import ToggleOneContentPage from "./ShowingListOfContent/ToggleOneContentPage";

export default function Dashboard({
  likedNames,
  namesCreated,
  createdDescriptions,
  likedDescriptions,
}) {
  const { data: session } = useSession();

  const userName = session?.user?.name || "Guest";

  const contentList = [
    { text: "Fav Names", className: "mb-2", value: "Fav Names" },
    {
      text: "Fav Descriptions",
      className: "mb-2",
      value: "Fav Descriptions",
    },
    {
      text: "Added Names",

      className: "mb-2",
      value: "Added Names",
    },
    {
      text: "Added Descriptions",

      className: "mb-2",
      value: "Added Descriptions",
    },
  ];

  return (
    <section>
      <div
        className="relative overflow-hidden bg-no-repeat bg-cover mx-auto"
        style={{
          backgroundPosition: "80%",
          backgroundImage: `url("/dogheaderfreewebheaders.jpg")`,
          height: "200px",
        }}
      ></div>

      <div className="container mx-auto px-4 md:px-12 xl:px-32 ">
        <div className="text-center text-subtleWhite bg-primary">
          <div
            className="block rounded-2xl shadow-lg px-6 py-2 md:py-4 md:px-12 blur-with-color"
            style={{
              marginTop: "-70px",
            }}
          >
            {!session ? (
              "Loading"
            ) : (
              <div>
                <section className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-subtleWhite mx-auto font-semibold text-3xl mb-2">
                      {`Welcome Back ${userName}!`}
                    </h3>

                    <PointSystemList
                      namesLikes={likedNames.length}
                      namesAdds={namesCreated.length}
                      descriptionsLikes={likedDescriptions.length}
                      descriptionsAdds={createdDescriptions.length}
                    />
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ############# FAVORITE LISTS SECTION ############ */}

      <section className=" px-4 pt-4   mx-auto  text-center">
        <div
          className="favoriteSubsections mt-5 text-subtleWhite  font-bold mb-2 text-lg 
       pb-2
       w-full"
        >
          {/* ############# FAVORITE NAMES LIST ############ */}

          <section className="flex flex-wrap gap-1 items-center justify-center">
            <h4 className="w-full text-xl mb-4">
              {" "}
              Select which content you wish to view{" "}
            </h4>

            <ToggleOneContentPage
              contentList={contentList}
              swrForThisUserID={session?.user?.id || ""}
            />
          </section>
        </div>
      </section>
    </section>
  );
}
