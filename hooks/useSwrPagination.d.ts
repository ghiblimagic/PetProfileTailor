import type { ContentListingItem } from "@/components/ShowingListOfContent/ContentListing";
import type { ContentType } from "@/utils/api/checkIfValidContentType";

type SwrPage = { data: ContentListingItem[]; totalDocs?: number };

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
    updater: (pages?: SwrPage[]) => SwrPage[],
    shouldRevalidate?: boolean,
  ) => void;
};

export function useSwrPagination(
  params: UseSwrPaginationParams,
): UseSwrPaginationResult;
