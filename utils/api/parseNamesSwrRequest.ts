/**
 * Pure request parsing for names SWR listing. Notes: docs/notes/app/api/names-swr-route.md
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
  // Case 1: Already an array of strings — e.g. ?likedIds=abc&likedIds=def → ["abc", "def"]
  // (built by searchParams.forEach above when the same key appears more than once)
  let likedIds = source.likedIds ?? [];
  if (!Array.isArray(likedIds)) {
    likedIds = [String(likedIds)];
  }

  if (!likedIds.length) {
    // Case 2: comma-separated fallback like ?likedIds=1,2,3
    // When the param was missing from forEach, searchParams.get returns e.g. "abc,def"
    // and we normalize into the same shape as Case 1: ["abc", "def"]
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
    tags: normalizeStringArray(source.tags),
    profileUserId: source.profileUserId
      ? String(source.profileUserId)
      : undefined,
    likedIds: normalizeStringArray(source.likedIds),
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
    return sortLogic;
  }

  return { ...sortLogic, _id: 1 };
}
