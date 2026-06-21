/**
 * SWR infinite pagination for name/description listing pages.
 * Notes: docs/notes/hooks/useSwrPagination.md
 */
"use client";

import useSWRInfinite from "swr/infinite";
import { useLikes, type LikeContentType } from "@/context/LikesContext";
import type { ContentListingItem } from "@/components/ShowingListOfContent/ContentListing";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

// using useSWRInfinite since the array-of-pages behavior is handy for flattening the chunks of items, so that way the front end page 1 doesn't have to be equal to a swr page 1
// useSWR would instead return a single data object, which doesn't work in our case since we're letting users chose if they want to view 5,10,20,50 ect items at a time

export type SwrPage = { data: ContentListingItem[]; totalDocs?: number };

export type SwrFetcherKey = string | [string, { body?: Record<string, unknown> }];

type SwrRequestOptions = { body?: Record<string, unknown>; method?: string };

export type SwrPaginationGetKeyParams = {
  dataType: ContentType | string;
  sortingProperty?: string;
  sortingValue?: number;
  tags?: string[];
  profileUserId?: string;
  likedIds?: string[] | null;
};

/** Returns true when liked-names filter is on but there is nothing to fetch. */
export function shouldSkipSwrPaginationForLikes(
  restrictSwrToLikedNames: boolean | undefined,
  likedIds: string[] | null,
): boolean {
  return (
    Boolean(restrictSwrToLikedNames && likedIds === null) ||
    Boolean(restrictSwrToLikedNames && likedIds.length === 0)
  );
}

/** SWR infinite getKey — page URLs, POST body for tags/profile/likedIds filters. */
export function buildSwrPaginationGetKey(
  index: number,
  previousPageData: SwrPage | null | undefined,
  params: SwrPaginationGetKeyParams,
): SwrFetcherKey | null {
  if (previousPageData && !previousPageData.data?.length) return null; // no more data
  if (index === undefined) return null; // stop fetching

  const page = index + 1; // SWR index starts at 0, but our API pages start at 1
  let url = "";
  if (params.dataType === "names") {
    url = `/api/names/swr?page=${page}&sortingproperty=${params.sortingProperty}&sortingvalue=${params.sortingValue}`;
  } else if (params.dataType === "descriptions") {
    url = `/api/description/swr?page=${page}&sortingproperty=${params.sortingProperty}&sortingvalue=${params.sortingValue}`;
  }
  // else if (params.dataType === "individualNames") {
  //   url = `/api/names/check-if-content-exists/${contentIdentifier}`;
  // }

  // POST in case likedIds is big; GET vs POST is decided in the fetcher
  const body: Record<string, unknown> = {};
  if (params.tags?.length) body.tags = params.tags;
  if (params.profileUserId) body.profileUserId = params.profileUserId;
  const { likedIds } = params;
  if (likedIds?.length || likedIds === null) body.likedIds = likedIds;

  return [url, Object.keys(body).length ? { body } : {}] as SwrFetcherKey;
}

const fetcher = (key: SwrFetcherKey) => {
  let url: string;
  let options: SwrRequestOptions = {};
  if (Array.isArray(key)) {
    [url, options] = key;
  } else {
    url = key;
  }

  const hasBody = options?.body && Object.keys(options.body).length > 0;

  return fetch(url, {
    method: hasBody ? options?.method || "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  }).then((res) => res.json()) as Promise<SwrPage>;
};

export type UseSwrPaginationParams = {
  dataType: ContentType | string;
  currentUiPage: number;
  itemsPerUiPage: number;
  tags?: string[];
  sortingProperty?: string;
  sortingValue?: number;
  contentIdentifier?: string;
  profileUserId?: string;
  restrictSwrToLikedNames?: boolean;
};

export type UseSwrPaginationResult = {
  data: ContentListingItem[];
  isLoading: boolean;
  error: unknown;
  totalItems: number;
  totalPagesInDatabase: number;
  size: number;
  setSize: (size: number | ((size: number) => number)) => void;
  isValidating: boolean;
  mutate: (
    updater?: (pages?: SwrPage[]) => SwrPage[],
    shouldRevalidate?: boolean,
  ) => void;
};

const emptyResult: UseSwrPaginationResult = {
  data: [],
  isLoading: false,
  error: null,
  totalItems: 0,
  totalPagesInDatabase: 0,
  size: 0,
  setSize: () => {},
  isValidating: false,
  mutate: () => {},
};

/**
 * Hook for SWR pagination with DB chunking
 */
export function useSwrPagination({
  dataType,
  currentUiPage,
  itemsPerUiPage,
  tags,
  sortingProperty,
  sortingValue,
  contentIdentifier,
  profileUserId,
  restrictSwrToLikedNames,
}: UseSwrPaginationParams): UseSwrPaginationResult {
  void contentIdentifier;
  const { getLikedIds } = useLikes();

  let likedIds: string[] | null = [];

  if (restrictSwrToLikedNames) {
    likedIds = getLikedIds(dataType as LikeContentType) || null;
    // console.log("likedIds in swr pagination", likedIds);
  }

  if (shouldSkipSwrPaginationForLikes(restrictSwrToLikedNames, likedIds)) {
    // if restrict to liked content but there are no likes, return early
    return emptyResult;
  }

  const getKey = (index: number, previousPageData: SwrPage | null) =>
    buildSwrPaginationGetKey(index, previousPageData, {
      dataType,
      sortingProperty,
      sortingValue,
      tags,
      profileUserId,
      likedIds,
    });

  const { data, error, size, isLoading, isValidating, setSize, mutate } =
    useSWRInfinite<SwrPage>(getKey, fetcher, {
      initialSize: 1,
      revalidateAll: false,
      revalidateOnMount: true, // recheck when mounting, aka when the user uses a link to return to this page, it'll refetch the 1st page
      revalidateFirstPage: false, // don't recheck first page whenever the page size changes
      revalidateIfStale: false, // don’t recheck if cache exists
      revalidateOnFocus: false, // don’t recheck on tab switch
      revalidateOnReconnect: false,
    });

  // Flatten all fetched DB chunks — (chunk?.data) prevents the crash if a chunk is undefined.
  const allItems = data ? data.flatMap((chunk) => chunk?.data ?? []) : [];

  // Total docs from API metadata
  const totalItems = data?.[0]?.totalDocs || 0;
  const totalPagesInDatabase = Math.ceil(totalItems / itemsPerUiPage);

  return {
    data: allItems,
    isLoading: isLoading ?? !data,
    error,
    totalItems,
    totalPagesInDatabase,
    size,
    setSize,
    isValidating,
    mutate,
  };
}
