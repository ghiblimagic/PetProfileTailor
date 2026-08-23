/**
 * UI pagination + SWR chunk preload for listing pages.
 * Edge cases and bug history: docs/notes/components/pagination.md
 */
"use client";

import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import startCooldown from "@utils/startCooldown";

// Decorative chevron for the per-page/sort-by selects, drawn as a CSS
// background-image (lucide's chevron-down path) instead of a DOM icon node.
// A background-image can never intercept a click, so the whole native
// <select> box stays clickable end-to-end with no pointer-events bookkeeping.
const CHEVRON_DOWN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'%3E%3C/path%3E%3C/svg%3E\")";

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
  /** Rendered at the start of the top row (e.g. the Filters toggle), so the
   * whole toolbar — including the page-number row below — shares one width
   * instead of the pagination controls being squeezed into leftover space. */
  filtersSlot?: ReactNode;
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
  filtersSlot,
}: PaginationProps) {
  const paginationCooldownRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const [remainingPaginationCooldown, setRemainingPaginationCooldown] =
    useState(0);

  const [windowStart, setWindowStart] = useState(1); // first page of the visible window

  const [totalLoadedPages, setTotalLoadedPages] = useState(0);
  const windowSize = 5; // max number of visible pages

  const startingItemCountForPage = Math.max(
    (currentUiPage - 1) * itemsPerPage + 1
  );
  const endingItemCountForPage = Math.min(
    currentUiPage * itemsPerPage,
    totalItems
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
          15
        );
      }
    }
  };

  useEffect(() => {
    const calculatedTotalLoadedPages = Math.ceil(
      amountOfDataLoaded / itemsPerPage
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

  const nextEnabled =
    (currentUiPage < totalLoadedPages && remainingPaginationCooldown === 0) ||
    (totalLoadedPages < totalPagesInDatabase &&
      !isValidating &&
      remainingPaginationCooldown === 0);
  const prevEnabled = currentUiPage !== 1;

  return (
    <section className="pagination-navigation w-full flex flex-col gap-3 min-w-0 my-2 border-t border-subtleBorder pt-4">
      {/* sorting logic*/}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {filtersSlot}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* wrapping the selects in sections & inline-block keeps the per page and sort by labels from wrapping weirdly at smaller sizes */}

          {/* Per page */}
          {/* The <select> itself is the entire visible pill (background,
            border, radius, padding all live on it) — no wrapper, no
            invisible overlay, no decoy text. The browser renders the real
            selected <option> text, so there's a single source of truth
            instead of a hand-maintained label mapping. The chevron is a
            CSS background-image (CHEVRON_DOWN_BG), which can't intercept
            clicks, so the whole pill stays clickable end-to-end. */}
          <select
            id="per-page"
            className="appearance-none bg-[oklch(0.20_0.015_260)] border border-[oklch(0.30_0.015_260)] rounded-[10px] pl-[14px] pr-7 py-[9px] text-subtleWhite text-[14px] cursor-pointer bg-no-repeat bg-[right_10px_center]"
            style={{ backgroundImage: CHEVRON_DOWN_BG }}
            value={itemsPerPage}
            onChange={(e) => resetItemsPerPage(e.target.value)}
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">25 per page</option>
            <option value="30">30 per page</option>
            <option value="40">40 per page</option>
            <option value="50">50 per page</option>
            {/* don't give an option 60 since it leads to an edge case since 60 is the amount of items we grab from the database each time (the chunk size)        */}
          </select>
          {/* sort by */}
          {/* Same real-select-is-the-pill treatment as per-page above. Option
            labels ("Most Liked" etc.) are already self-describing, so no
            extra caption text is needed. */}
          {remainingSortCooldown > 0 ? (
            <select
              className="appearance-none bg-[oklch(0.20_0.015_260)] border border-[oklch(0.30_0.015_260)] rounded-[10px] px-[14px] py-[9px] text-subtleWhite text-[14px] opacity-50 cursor-not-allowed w-56"
              disabled
            >
              <option>
                Please wait {remainingSortCooldown} second
                {remainingSortCooldown > 1 ? "s" : ""}
              </option>
            </select>
          ) : (
            <select
              id="sort-by"
              className="appearance-none bg-[oklch(0.20_0.015_260)] border border-[oklch(0.30_0.015_260)] rounded-[10px] pl-[14px] pr-7 py-[9px] text-subtleWhite text-[14px] cursor-pointer bg-no-repeat bg-[right_10px_center]"
              style={{ backgroundImage: CHEVRON_DOWN_BG }}
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
        </div>
      </div>

      {/* PAGINATION ARROWS */}
      {remainingPaginationCooldown !== 0 && (
        <p className="text-subtleWhite/60 text-sm mx-auto">
          {`Please wait ${remainingPaginationCooldown} secs`}
        </p>
      )}

      <div className="flex flex-wrap gap-2 justify-center my-auto items-center ">
        <button
          className="prevpage w-8 h-8 rounded-full border border-subtleBorder flex items-center justify-center disabled:cursor-not-allowed"
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
          <ChevronLeft
            size={18}
            color={prevEnabled ? "rgb(221 214 254)" : "grey"}
          />
        </button>

        {pageNumbers.map((number) => {
          return (
            <GeneralButton
              text={String(number)}
              key={number}
              subtle={true}
              active={number === currentUiPage}
              className={`!w-8 !h-8 !p-0 !my-0 !rounded-full !border !flex !items-center !justify-center !text-sm ${
                number === currentUiPage
                  ? "!bg-blue-600 !border-blue-700 !text-white"
                  : "!bg-transparent !border-subtleBorder !text-subtleWhite"
              }`}
              onClick={() => handleClickPage(number)}
            />
          );
        })}

        <button
          aria-label="nextpage"
          className="nextpage w-8 h-8 rounded-full border border-subtleBorder flex items-center justify-center disabled:cursor-not-allowed"
          type="submit"
          onClick={() => lastPageHandler()}
        >
          <ChevronRight
            size={18}
            color={nextEnabled ? "rgb(221 214 254)" : "grey"}
          />
        </button>
      </div>
      <span className="text-slate-400 text-xs mx-auto mb-2">
        {`${startingItemCountForPage}-${endingItemCountForPage} of ${totalItems} Items`}
      </span>
    </section>
  );
}
