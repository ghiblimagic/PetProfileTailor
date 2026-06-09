/**
 * Pure request parsing for SWR listing routes (names + descriptions).
 * Notes: docs/notes/app/api/names-swr-route.md, description-swr-route.md
 */

export type NamesSwrSource = Record<
  string,
  string | string[] | number | undefined
>;

export type ParsedNamesSwrRequest = {
  page: number;
  sortingValue: number;
  sortingProperty: string;
  tags?: string[];
  profileUserId?: string;
  likedIds?: string[];
};

export function parseSourceFromGet(
  searchParams: URLSearchParams,
): NamesSwrSource {
  const source: NamesSwrSource = {};

  searchParams.forEach((value, key) => {
    const existing = source[key];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        source[key] = [String(existing), value];
      }
    } else {
      source[key] = value;
    }
  });

  // Handle likedIds: support repeated params & CSV
  // Case 1: Already an array of string
  // ["abc", "def"].
  let likedIds = source.likedIds ?? [];
  if (!Array.isArray(likedIds)) {
    likedIds = [String(likedIds)];
  }

  if (!likedIds.length) {
    // Case 2: support comma-separated fallback like ?likedIds=1,2,3
    // ["abc,def"] (a single string)
    // Normalizes it into the same shape as Case 1
    const likedCsv = searchParams.get("likedIds");
    if (likedCsv) {
      likedIds = likedCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  source.likedIds = likedIds;
  return source;
}

/** Description SWR: filters only — page/sort always read from URL separately. */
export function buildSwrFilterSourceFromSearchParams(
  searchParams: URLSearchParams,
): NamesSwrSource {
  // Build the same shape as the old req.query would have produced
  const tags = searchParams.getAll("tags");

  // for if we're only returning items the user liked, for the dashboard SWR
  let likedIds = searchParams.getAll("likedIds");
  // Case 1: Already an array of string
  // ["abc", "def"].
  if (!likedIds.length) {
    // Case 2: support comma-separated fallback like ?likedIds=1,2,3
    // ["abc,def"] (a single string)
    // Normalizes it into the same shape as Case 1
    const likedCsv = searchParams.get("likedIds");
    if (likedCsv) {
      likedIds = likedCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // Filter by user ID if provided
  const profileUserId = searchParams.get("profileUserId") || undefined;

  const source: NamesSwrSource = {};
  if (tags.length) source.tags = tags;
  if (profileUserId) source.profileUserId = profileUserId;
  if (likedIds.length) source.likedIds = likedIds;

  return source;
}

/** Description SWR: pagination/sort always from query string, not POST body. */
export function parseSwrPaginationFromSearchParams(
  searchParams: URLSearchParams,
): Pick<ParsedNamesSwrRequest, "page" | "sortingValue" | "sortingProperty"> {
  return {
    page: parseInt(searchParams.get("page") || "1", 10) || 1,
    sortingValue: parseInt(searchParams.get("sortingvalue") || "-1", 10) || -1,
    sortingProperty: searchParams.get("sortingproperty") || "likedByCount",
  };
}

export function parseSwrFilters(
  source: NamesSwrSource,
): Pick<ParsedNamesSwrRequest, "tags" | "profileUserId" | "likedIds"> {
  return {
    tags: normalizeStringArray(source.tags),
    profileUserId: source.profileUserId
      ? String(source.profileUserId)
      : undefined,
    likedIds: normalizeStringArray(source.likedIds),
  };
}

export function mergePostBodyWithSearchParams(
  body: NamesSwrSource,
  searchParams: URLSearchParams,
): NamesSwrSource {
  const source = { ...body };

  searchParams.forEach((value, key) => {
    if (!source[key]) {
      source[key] = value;
    }
  });

  return source;
}

function normalizeStringArray(
  value: string | string[] | number | undefined,
): string[] | undefined {
  if (value === undefined || value === "") return undefined;
  if (Array.isArray(value)) {
    return value.length ? value.map(String) : undefined;
  }
  return [String(value)];
}

export function parseNamesSwrRequest(
  source: NamesSwrSource,
): ParsedNamesSwrRequest {
  const page = parseInt(String(source.page ?? ""), 10) || 1;
  const sortingValue = parseInt(String(source.sortingvalue ?? ""), 10) || -1;
  const sortingProperty =
    (source.sortingproperty as string | undefined) || "likedByCount";

  return {
    page,
    sortingValue,
    sortingProperty,
    ...parseSwrFilters(source),
  };
}

export function buildNamesSwrSort(
  sortingProperty: string,
  sortingValue: number,
): Record<string, 1 | -1> {
  const sortLogic: Record<string, 1 | -1> = {
    [sortingProperty]: sortingValue === 1 ? 1 : -1,
  };

  if (sortingProperty === "_id") {
    return sortLogic; // If sorting by _id, don't add tiebreaker
  }

  // Otherwise, add _id as tiebreaker
  return { ...sortLogic, _id: 1 }; // _id in ascending order — see route docs for tiebreaker notes
}
