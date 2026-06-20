import { expect, type APIRequestContext } from "@playwright/test";

type SeededContent = {
  _id: string;
  content: string;
  createdBy: { _id: string; name?: string; profileName?: string };
  likedByCount?: number;
  tags?: Array<{ _id: string; tag?: string } | string>;
};

type LookupResponse = {
  type: string;
  data?: SeededContent;
  message?: string;
};

function contentId(doc: SeededContent): string {
  return typeof doc._id === "string" ? doc._id : String(doc._id);
}

function creatorId(doc: SeededContent): string {
  const id = doc.createdBy._id;
  return typeof id === "string" ? id : String(id);
}

export async function lookupSeededName(
  request: APIRequestContext,
  content: string,
): Promise<SeededContent & { id: string; creatorId: string }> {
  const response = await request.get(
    `/api/names/check-if-content-exists/${encodeURIComponent(content)}`,
  );
  expect(response.ok()).toBeTruthy();

  const json = (await response.json()) as LookupResponse;
  expect(json.type).toBe("duplicate");
  expect(json.data).toBeTruthy();

  const data = json.data!;
  return { ...data, id: contentId(data), creatorId: creatorId(data) };
}

export async function lookupSeededDescription(
  request: APIRequestContext,
  content: string,
): Promise<SeededContent & { id: string; creatorId: string }> {
  const response = await request.get(
    `/api/description/check-if-content-exists/${encodeURIComponent(content)}`,
  );
  expect(response.ok()).toBeTruthy();

  const json = (await response.json()) as LookupResponse;
  expect(json.type).toBe("duplicate");
  expect(json.data).toBeTruthy();

  const data = json.data!;
  return { ...data, id: contentId(data), creatorId: creatorId(data) };
}

export async function lookupUserByProfileName(
  request: APIRequestContext,
  profileName: string,
): Promise<{
  _id: string;
  profileName: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  name?: string;
  followers: string[];
}> {
  const response = await request.get(
    `/api/user/getASpecificUserByProfileName/${encodeURIComponent(profileName)}`,
  );
  expect(response.ok()).toBeTruthy();

  const user = (await response.json()) as {
    _id: string;
    profileName: string;
    profileImage?: string;
    bio?: string;
    location?: string;
    name?: string;
    followers?: Array<string | { _id: string }>;
  };

  const followers = (user.followers ?? []).map((f) =>
    typeof f === "string" ? f : String(f._id),
  );

  return {
    _id: typeof user._id === "string" ? user._id : String(user._id),
    profileName: user.profileName,
    profileImage: user.profileImage,
    bio: user.bio,
    location: user.location,
    name: user.name,
    followers,
  };
}

export function tagIdsFromSeededContent(
  seeded: Pick<SeededContent, "tags">,
): string[] {
  return (seeded.tags ?? []).map((tag) =>
    typeof tag === "object" ? String(tag._id) : String(tag),
  );
}

export function seededHasTagSlug(
  seeded: Pick<SeededContent, "tags">,
  tagSlug: string,
): boolean {
  return (seeded.tags ?? []).some(
    (tag) =>
      typeof tag === "object" &&
      "tag" in tag &&
      tag.tag === tagSlug,
  );
}
