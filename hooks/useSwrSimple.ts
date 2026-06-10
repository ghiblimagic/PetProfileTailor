/**
 * Infinite SWR for `/api/notifications/{type}` paginated feeds.
 * Notes: docs/notes/app/notifications-page.md
 */
import useSWRInfinite from "swr/infinite";
import axios from "axios";

const PAGE_SIZE = 25;

export type NotificationModelType = "thanks" | "names" | "descriptions";

export type UseSWRSimpleOptions = {
  initialPage?: unknown[] | null;
  revalidateFirstPage?: boolean;
  enabled?: boolean;
  revalidateIfStale?: boolean;
  revalidateOnMount?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
};

export type SwrSimpleReturn = {
  SWRNotifications: unknown[];
  error: unknown;
  isLoading: boolean;
  SWRisReachingEnd: boolean | undefined;
  size: number;
  setSize: (size: number | ((current: number) => number)) => void;
  mutate: ReturnType<typeof useSWRInfinite<unknown[]>>["mutate"];
};

//modelType: "thanks" | "names" | "descriptions"
export function useSWRSimple(
  modelType: NotificationModelType,
  {
    initialPage = null,
    revalidateFirstPage = true,
    enabled = true,
    revalidateIfStale = true,
    revalidateOnMount = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
  }: UseSWRSimpleOptions = {},
): SwrSimpleReturn {
  console.log("enabled in useSWRSimple", enabled, modelType);
  //  { initialPage = null, revalidateFirstPage = true }
  // allows us to preload server the first swr data for the thanksNotifications, but to let the other 2 notifications load normally
  const getKey = (
    pageIndex: number,
    previousPageData: unknown[] | null,
  ): string | null => {
    if (!enabled) return null; // <-- prevents fetching of names and description likes until the list is toggled
    if (previousPageData && !previousPageData.length) return null; // reached end, do not request more pages after the empty one
    return `/api/notifications/${modelType}?&page=${
      pageIndex + 1
    }&limit=${PAGE_SIZE}`;
  };

  const fetcher = (url: string) =>
    axios.get<unknown[]>(url).then((res) => res.data);

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    {
      fallbackData: initialPage ? [initialPage] : undefined,
      revalidateFirstPage,
      revalidateIfStale, //Refetch cached data considered "stale"
      revalidateOnMount, // Fetch immediately on mount
      revalidateOnFocus, // refresh on tab switch
      revalidateOnReconnect,
    },
  );

  console.log("data in useSWRsimple", data, modelType);

  const SWRNotifications = data ? data.flat() : [];

  const SWRisReachingEnd = Boolean(
    data && data[data.length - 1]?.length < PAGE_SIZE,
  );

  return {
    SWRNotifications,
    error,
    isLoading,
    SWRisReachingEnd,
    size,
    setSize,
    mutate,
  };
}
