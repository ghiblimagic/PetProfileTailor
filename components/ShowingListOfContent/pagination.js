import React, { useEffect, useState, useRef, useMemo } from "react";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronCircleRight } from "@fortawesome/free-solid-svg-icons";
import startCooldown from "@utils/startCooldown";

export default function Pagination({
  itemsPerPage,
  setItemsPerPageFunction,
  setSize,
  size,
  currentUiPage,
  setCurrentUiPage,
  setSortingLogicFunction,
  totalPagesInDatabase,
  totalItems,
  amountOfDataLoaded, // Add this prop to get the actual loaded items
  remainingSortCooldown,
  sortingValue,
  sortingProperty,
}) {
  const paginationCooldownRef = useRef(null);
  const [remainingPaginationCooldown, setRemainingPaginationCooldown] =
    useState(0);

  const [windowStart, setWindowStart] = useState(1); // first page of the visible window

  const [totalLoadedPages, setTotalLoadedPages] = useState(0);
  const windowSize = 5; // max number of visible pages

  const startingItemCountForPage = Math.max(
    (currentUiPage - 1) * itemsPerPage + 1,
  );
  const endingItemCountForPage = Math.min(
    currentUiPage * itemsPerPage,
    totalItems,
  );

  useEffect(() => {
    const calculatedTotalLoadedPages = Math.ceil(
      amountOfDataLoaded / itemsPerPage,
    );

    setTotalLoadedPages(calculatedTotalLoadedPages);
  }, [amountOfDataLoaded, size, itemsPerPage]);

  const windowEnd = Math.min(windowStart + windowSize - 1, totalLoadedPages);

  // Make pageNumbers reactive using useMemo
  const pageNumbers = useMemo(() => {
    const numbers = [];

    for (let i = windowStart; i <= windowEnd; i++) {
      numbers.push(i);
    }

    return numbers;
  }, [windowStart, windowEnd, totalLoadedPages]);
  // useMemo only recalculates when the dependencies actually change, not on every render

  const preLoadNextPage = (overrides = {}) => {
    // called when:
    // 1. When clicking the next arrow (lastPageHandler)
    // 2. When changing items per page (resetItemsPerPage)

    // Solves bug:
    // overrides handle a timing bug where preLoadNextPage was using the old totalLoadedPages state value since react updates are asynchronous. Instead the function that calls preLoadNextPage calculates what this value will be and passes it as overrides
    // Behavior of bug: when there was 72 items and 50 items per page were selected, but only 1 page icon had shown and the next page icon was greyed out.  It had given a false sense of having more pages we actually had with the new items-per-page.

    // Using buggy OLD state values:
    //currentPage + 2 >= totalLoadedPages  // State value = 5
    //1 + 2 >= 5
    //3 >= 5  // FALSE ❌
    //Why it failed: The old totalLoadedPages of 5 made it think "we have 5 pages loaded, you're on page 1, that's plenty of buffer!" So it didn't preload.

    // Using overrides solution:
    // const newTotalLoadedPages = Math.ceil(50 / 50) = 1
    // currentPage + 2 >= loadedPages  // Calculated value = 1
    // 1 + 2 >= 1
    // 3 >= 1  // TRUE ✅

    // Why it works: With 50 per page, those same 50 items only make 1 page, so we're at the edge and need to preload!

    const currentPage = overrides.currentPage ?? currentUiPage;
    const loadedPages = overrides.totalLoadedPages ?? totalLoadedPages;
    const skipCooldown = overrides.skipCooldown ?? false; // Add flag

    // If we're at the last loaded page and there's more data to fetch
    if (
      // we're going to pretend we're 2 pages ahead, so we can have the next pages loaded ahead of time
      // so theres no flicker of the pagination > button being greyed out
      currentPage + 2 >= loadedPages &&
      loadedPages < totalPagesInDatabase
    ) {
      // Trigger SWR to fetch next chunk
      setSize(size + 1);
      if (!skipCooldown) {
        // Only cooldown for manual clicks
        startCooldown(
          paginationCooldownRef,
          setRemainingPaginationCooldown,
          15,
        );
      }
      return;
    }
  };

  const resetItemsPerPage = (selection) => {
    const newPerPage = Number(selection);
    setItemsPerPageFunction(newPerPage);
    // move user back to page 1 visually and through swr, since we're changing how we're switching to new database logic
    setCurrentUiPage(1);
    setWindowStart(1); // reset visible pagination window, so we're seeing items 1-50 instead of being stuck at 150 of 233 ect

    // Calculate what totalLoadedPages WILL BE with the new itemsPerPage
    const newTotalLoadedPages = Math.ceil(amountOfDataLoaded / newPerPage);

    // Pass the future values!
    preLoadNextPage({
      currentPage: 1,
      totalLoadedPages: newTotalLoadedPages,
      skipCooldown: true, // Don't show cooldown for automatic preload
    });
  };

  const lastPageHandler = () => {
    if (remainingPaginationCooldown > 0) {
      return;
    }

    // If we have more pages loaded, just move to the next UI page

    if (currentUiPage < totalLoadedPages) {
      updateWindow(currentUiPage + 1);
      setCurrentUiPage(currentUiPage + 1);
    }

    // If we're at the last loaded page and there's more data to fetch
    preLoadNextPage();
  };

  const updateWindow = (page) => {
    // Slide the window if page goes beyond visible range
    if (page >= windowStart + windowSize) {
      setWindowStart(page - windowSize + 1);
    } else if (page < windowStart) {
      setWindowStart(page);
    }
  };

  const handleClickPage = (page) => {
    if (page >= totalLoadedPages && totalLoadedPages < totalPagesInDatabase) {
      setSize(size + 1); // trigger SWR fetch for more pages
    }
    setCurrentUiPage(page);
    updateWindow(page);
  };
  return (
    <section className="pagination-navigation grid grid-rows-1 min-w-0 my-2  border-t border-violet-300 text-violet-900 font-bold pt-2 ">
      {/* sorting logic*/}
      <div className="inline  my-auto pt-3 ">
        {/* wrapping the selects in sections & inline-block keeps the per page and sort by labels from wrapping weirdly at smaller sizes */}

        {/* Per page */}
        <section className="inline-block">
          <select
            id="per-page"
            className="bg-secondary text-subtleWhite ml-2 rounded-2xl border-subtleWhite"
            value={itemsPerPage}
            onChange={(e) => resetItemsPerPage(e.target.value)}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">25</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>
          <label
            className="text-white ml-2"
            htmlFor="per-page"
          >
            Per Page
          </label>
        </section>
        {/* sort by */}
        <section className="inline-block">
          {remainingSortCooldown > 0 ? (
            <select
              className="bg-secondary text-subtleWhite ml-2 p-2 opacity-50 cursor-not-allowed border rounded w-56"
              disabled
            >
              <option>
                Please wait {remainingSortCooldown} second
                {remainingSortCooldown > 1 ? "s" : ""}
              </option>
            </select>
          ) : (
            <select
              id="per-page"
              className="bg-secondary border-subtleWhite text-subtleWhite ml-2 p-2 border  w-40 rounded-2xl"
              onChange={(e) => setSortingLogicFunction(e.target.value)}
              value={`${sortingProperty},${sortingValue}`}
              // so we remember what the user selected after the timeout
            >
              <option value="likedByCount,-1">Most Liked</option>
              <option value="likedByCount,1">Least Liked</option>
              <option value="_id,-1">Newest</option>
              <option value="_id,1">Oldest</option>
            </select>
          )}

          {/* <label
            className="text-white ml-2"
            htmlFor="per-page"
          >
            Sort by
          </label> */}
        </section>
      </div>

      {/* PAGINATION ARROWS */}
      {remainingPaginationCooldown !== 0 && (
        <p className="text-subtleWhite mx-auto">
          {" "}
          {`Please wait ${remainingPaginationCooldown} secs`}
        </p>
      )}

      <div className="flex flex-wrap gap-2 justify-center my-auto items-center ">
        <button
          className="prevpage"
          aria-label="prevpage"
          disabled={currentUiPage == 1}
          type="submit"
          onClick={() => {
            if (currentUiPage > 1) {
              setCurrentUiPage(currentUiPage - 1);
              updateWindow(currentUiPage - 1);
            }
          }}
        >
          <FontAwesomeIcon
            icon={faChevronCircleRight}
            className="text-[38px] fa-rotate-180 leading-none "
            color={`${currentUiPage === 1 ? "grey" : "rgb(221 214 254)"}`}
          />
        </button>

        {pageNumbers.map((number) => {
          return (
            <GeneralButton
              text={number}
              key={number}
              subtle={true}
              active={number === currentUiPage}
              className={` px-4`}
              onClick={
                () => handleClickPage(number)

                // number == lastPageNumber
                //   ? clickOnLastNumber(number)
                //   : setPageFunction(number)
              }
            />
          );
        })}

        <button
          aria-label="nextpage"
          className="nextpage aligncenter"
          type="submit"
          onClick={() => lastPageHandler()}
        >
          <FontAwesomeIcon
            icon={faChevronCircleRight}
            className="text-[38px]   "
            color={`${
              currentUiPage < totalLoadedPages ? "rgb(221 214 254)" : "grey" //subtle white or grey
            }`}
          />
        </button>
      </div>
      <span className="text-white mx-auto mb-2">
        {`${startingItemCountForPage}-${endingItemCountForPage} of ${totalItems} Items`}
      </span>
    </section>
  );
}
