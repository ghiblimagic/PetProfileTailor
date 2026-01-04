"use client";

import React, { useEffect, useState, useRef } from "react";
import { Drawer } from "@mui/material";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import FilteringSidebar from "@components/Filtering/FilteringSidebar";
import PageTitleWithImages from "@components/ReusableSmallComponents/TitlesOrHeadings/PageTitleWithImages";
import ContentListing from "@/components/ShowingListOfContent/ContentListing";
import Pagination from "@components/ShowingListOfContent/pagination";
import CheckForMoreData from "@components/ReusableSmallComponents/buttons/CheckForMoreDataButton";
import { useSwrPagination } from "@hooks/useSwrPagination";
import startCooldown from "@utils/startCooldown";
import Image from "next/image";
import LinkButton from "./ReusableSmallComponents/buttons/LinkButton";

import { useSession } from "next-auth/react";
import LoadingSpinner from "./ui/LoadingSpinner";

export default function CoreListingPageLogic({
  dataType,
  swrForThisUserID = "",
  showHeader = true,
  restrictSwrToLikedNames = false,
}) {
  // console.log("restrictSwrToLikedNames", restrictSwrToLikedNames);
  const { data: session } = useSession();
  const [remainingFilterCooldown, setRemainingFilterCooldown] = useState(0);
  const [remainingSortCooldown, setRemainingSortCooldown] = useState(0);
  const filterCooldownRef = useRef(null);
  const sortIntervalRef = useRef(null);
  let profileUserId = swrForThisUserID;

  // prevents overlapping cooldown intervals by attaching the interval to useRef, it will clear after 5 seconds
  // so we check if filterCooldownRef.current has no intervals currently going before running another interval

  let userName = "";
  let profileImage = "";
  let signedInUsersId = "";

  if (session?.user) {
    userName = session.user.name;
    profileImage = session.user.profileImage;
    signedInUsersId = session.user.id;
  }

  // store liked IDs in a ref so updates don't trigger full re-render

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [filterTagsIds, setFilterTagsIds] = useState([]);

  const [currentUiPage, setCurrentUiPage] = useState(1);
  const [itemsPerUiPage, setItemsPerUiPage] = useState(10);

  const [sortingValue, setSortingValue] = useState(-1);
  const [sortingProperty, setSortingProperty] = useState("likedByCount");
  const [triggerApplyFilters, setTriggerApplyFilters] = useState([]);

  const toggleDrawer = (newOpen) => {
    setIsOpen(newOpen);
  };

  // ########### SWR Section #################

  const {
    data,
    totalPagesInDatabase,
    totalItems,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate,
  } = useSwrPagination({
    dataType,
    currentUiPage,
    itemsPerUiPage,
    tags: triggerApplyFilters,
    sortingProperty: sortingProperty,
    sortingValue: sortingValue,
    profileUserId,
    restrictSwrToLikedNames,
  });

  // console.log("SWR", Array.isArray(data)); // true
  // console.log("SWR", data.length);
  // console.log("SWR", typeof data[0]); // "object"
  // console.log("SWR first item", data[0] ? data[0]._id : "null"); // check first object's id

  let content = data ?? [];

  // console.log("content check", content);

  // ############ Section for passing state into components as functions #######

  function setItemsPerPageFunction(event) {
    setItemsPerPage(event);
  }

  function setPageFunction(event) {
    setSize(event);
  }

  function setSortingLogicFunction(event) {
    // setSortingLogicString(event);
    setSortingValue(event.split(",")[1]);
    setSortingProperty(event.split(",")[0]);
    startCooldown(sortIntervalRef, setRemainingSortCooldown, 3);
  }

  // ########## End of section for passing state into components as functions ####

  const handleFilterChange = (e) => {
    // console.log("handleFilterChange", e.target);
    // console.log("handleFilterChange filterTagsIds", filterTagsIds);
    const { value, checked } = e.target;

    checked
      ? setFilterTagsIds([...filterTagsIds, value])
      : setFilterTagsIds(filterTagsIds.filter((tag) => tag != value));
  };

  const handleApplyFilters = (reset) => {
    if (reset) {
      setFilterTagsIds([]);
    } else {
      startCooldown(filterCooldownRef, setRemainingFilterCooldown);
      setTriggerApplyFilters(filterTagsIds);
      toggleDrawer(false);
    }
    setCurrentUiPage(1);

    setSize(1);
  };

  //#################### END of SWR section ##############

  // if users have changed how the items get sorted, then start over swr from page 1
  useEffect(() => {
    setSize(1);
  }, [sortingValue, sortingProperty]);

  //########### Section that allows the deleted content to be removed without having to refresh the page, react notices that a key has been removed from the content list and unmounts that content ###########

  return (
    <div>
      {showHeader && (
        <section className="sm:px-4  mx-auto">
          <PageTitleWithImages
            title="Fetch"
            title2={
              (dataType === "names" && "Names") ||
              (dataType == "descriptions" && "Descriptions")
            }
          />
        </section>
      )}
      {/* *****************  Drawer for filtering options *****************  */}
      <Drawer
        open={isOpen}
        onClose={(event, reason) => {
          if (reason === "backdropClick") {
            // prevent closing when clicking on backdrop
            return;
          }
          toggleDrawer(false);
        }}
        anchor="left"
        // gets rid of white background of mui drawer
        sx={{
          "& .MuiDrawer-paper": {
            backgroundColor: "transparent",
            boxShadow: "none",
          },
        }}
      >
        <div className="w-full max-w-[451px] h-full  flex flex-col overflow-x-clip">
          <FilteringSidebar
            dataType={dataType}
            handleFilterChange={handleFilterChange}
            handleApplyFilters={handleApplyFilters}
            filterTagsIds={filterTagsIds}
            toggleDrawer={toggleDrawer}
            isLoading={isLoading}
            remainingFilterCooldown={remainingFilterCooldown}
            filterCooldownRef={filterCooldownRef}
            startCooldown={startCooldown}
          />
        </div>
      </Drawer>

      {content?.length === 0 && !isLoading ? (
        <div className="text-center my-6 text-subtleWhite">
          <GeneralButton
            text={`${isOpen ? "Close Filters" : "Open Filters"}`}
            onClick={() => setIsOpen(!isOpen)}
          />
          <p className="mb-4">
            {`We dug deep but there's no ${
              restrictSwrToLikedNames
                ? `liked ${dataType}`
                : `created ${dataType}`
            }!`}
          </p>
          <p className="mb-4">
            {`${`Psst, ${
              restrictSwrToLikedNames ? "like" : "add"
            } ${dataType} and we'll hide them here, so our pup can dig them up for you! 🐶`}`}
          </p>

          <Image
            src="/digging-dog.svg"
            alt="dog digging a hole"
            width={218}
            height={150}
            unoptimized={true}
            loading="lazy"
            className="block mx-auto"
            // Image is wrapped in a span, so we need to change it to block for mx-auto to work
          />

          <a href="https://www.freepik.com/free-vector/dog-digging-dirt-white-background_18973243.htm">
            <small className="block">
              {" "}
              Dog Digging Icon by brgfx on Freepik{" "}
            </small>
          </a>

          <section className="border-t my-8">
            <h4 className="mt-8 text-xl">Do you think this is an error?</h4>
            <p className="my-4">
              Ruh Roh! Apologies for that, please use the contact form to let me
              know.
            </p>

            <p className="mt-4">I&apos;ll need to know:</p>
            <ol className="my-4 list-decimal list-inside">
              <li className="mb-2">
                It happened on the dashboard page for
                {` ${
                  restrictSwrToLikedNames ? "liked" : "created"
                } ${dataType} `}
              </li>
              <li className="mb-2">
                The email associated with your account, I&apos;ll{" "}
                <strong className="underline">never</strong> ask for your
                password
              </li>
            </ol>

            <LinkButton
              href="/contact"
              text="Contact"
              className="py-2"
              subtle
            />
          </section>
        </div>
      ) : (
        <div className="flex sm:px-2  mx-auto ">
          {/*################# CONTENT DIV ################### */}

          <div className="grow max-w-5xl mx-auto bg-primary rounded-box place-items-center  ">
            {/* Button that toggles the filter div */}
            <GeneralButton
              text={`${isOpen ? "Close Filters" : "Open Filters"}`}
              onClick={() => setIsOpen(!isOpen)}
            />

            <Pagination
              itemsPerPage={itemsPerPage}
              setItemsPerPageFunction={setItemsPerPageFunction}
              setPageFunction={setPageFunction}
              setSize={setSize}
              size={size}
              currentUiPage={currentUiPage}
              setCurrentUiPage={setCurrentUiPage}
              setSortingLogicFunction={setSortingLogicFunction}
              totalPagesInDatabase={totalPagesInDatabase}
              totalItems={totalItems}
              amountOfDataLoaded={data?.length}
              remainingSortCooldown={remainingSortCooldown}
              sortingValue={sortingValue}
              sortingProperty={sortingProperty}
              isValidating={isValidating}
            />

            <section className="w-full">
              {isLoading && <LoadingSpinner />}

              <section className="whitespace-pre-line ">
                {content?.length > 0 &&
                  content
                    .slice(
                      currentUiPage - 1 == 0
                        ? 0
                        : (currentUiPage - 1) * itemsPerPage,
                      currentUiPage * itemsPerPage,
                    )
                    .map((singleContent) => {
                      return (
                        <ContentListing
                          dataType={dataType}
                          singleContent={singleContent}
                          key={singleContent._id}
                          // VITAL for the ui to see the mutation changes, if the key hasn't changed, then react will ignore the updates
                          signedInUsersId={signedInUsersId}
                          mutate={mutate}
                        />
                      );
                    })}

                {/* <CheckForMoreData
                filteredListLastPage={filteredListLastPage} //deleted
                setSize={setSize}
              /> */}
              </section>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
