/**
 * UI pagination + SWR chunk preload for listing pages.
 * Edge cases and bug history: docs/notes/components/pagination.md
 */
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronCircleRight } from "@fortawesome/free-solid-svg-icons";
import startCooldown from "@utils/startCooldown";

type PreLoadOverrides = {
  currentPage?: number;
  totalLoadedPages?: number;
  skipCooldown?: boolean;
};

export type PaginationProps = {
  itemsPerPage: number;
  setItemsPerPageFunction: (selection: number) => void;
  setSize: (size: number | ((size: number) => number)) => void;
  size: number;
  currentUiPage: number;
  setCurrentUiPage: (page: number) => void;
  setSortingLogicFunction: (value: string) => void;
  totalPagesInDatabase: number;
  totalItems: number;
  amountOfDataLoaded: number; // actual loaded items across all SWR chunks
  remainingSortCooldown: number;
  sortingValue: number;
  sortingProperty: string;
  isValidating: boolean;
};

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
  amountOfDataLoaded,
  remainingSortCooldown,
  sortingValue,
  sortingProperty,
  isValidating,
}: PaginationProps) {
  const paginationCooldownRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
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

  const preLoadNextPage = (overrides: PreLoadOverrides = {}) => {
    // called when:
    // 1. When clicking the next arrow (lastPageHandler)
    // 2. When changing items per page (resetItemsPerPage)
    // Longer bug history + override timing: docs/notes/components/pagination.md

    const currentPage = overrides.currentPage ?? currentUiPage;
    const loadedPages = overrides.totalLoadedPages ?? totalLoadedPages;
    const skipCooldown = overrides.skipCooldown ?? false; // skip cooldown for automatic preload

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
    }
  };

  useEffect(() => {
    const calculatedTotalLoadedPages = Math.ceil(
      amountOfDataLoaded / itemsPerPage,
    );

    setTotalLoadedPages(calculatedTotalLoadedPages);

    // handles edge case where we're at the exact boundary after filters change
    if (
      currentUiPage + 1 >= calculatedTotalLoadedPages &&
      calculatedTotalLoadedPages < totalPagesInDatabase &&
      remainingPaginationCooldown === 0
    ) {
      preLoadNextPage({
        currentPage: currentUiPage,
        totalLoadedPages: calculatedTotalLoadedPages,
        skipCooldown: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preLoadNextPage uses latest closure; deps match original JS
  }, [
    amountOfDataLoaded,
    itemsPerPage,
    currentUiPage,
    totalPagesInDatabase,
    remainingPaginationCooldown,
  ]);

  const windowEnd = Math.min(windowStart + windowSize - 1, totalLoadedPages);

  // Make pageNumbers reactive using useMemo
  const pageNumbers = useMemo(() => {
    const numbers: number[] = [];

    for (let i = windowStart; i <= windowEnd; i++) {
      numbers.push(i);
    }

    return numbers;
  }, [windowStart, windowEnd, totalLoadedPages, isValidating]);
  // useMemo only recalculates when the dependencies actually change, not on every render

  const resetItemsPerPage = (selection: string) => {
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

    if (isValidating) {
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

  const updateWindow = (page: number) => {
    // Slide the window if page goes beyond visible range
    if (page >= windowStart + windowSize) {
      setWindowStart(page - windowSize + 1);
    } else if (page < windowStart) {
      setWindowStart(page);
    }
  };

  const handleClickPage = (page: number) => {
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
            {/* don't give an option 60 since it leads to an edge case since 60 is the amount of items we grab from the database each time (the chunk size)        */}
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
              text={String(number)}
              key={number}
              subtle={true}
              active={number === currentUiPage}
              className={` px-4`}
              onClick={() => handleClickPage(number)}
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
              (currentUiPage < totalLoadedPages &&
                remainingPaginationCooldown === 0) ||
              (totalLoadedPages < totalPagesInDatabase &&
                !isValidating &&
                remainingPaginationCooldown === 0)
                ? "rgb(221 214 254)"
                : "grey"
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
