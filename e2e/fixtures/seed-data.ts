import seedData from "./seed-data.json";

export const SEED_NAME = seedData.name.content;
export const SEED_NAME_DUPLICATE_VARIANT = seedData.name.duplicateVariant;
export const SEED_NAME_WITH_SPACES =
  seedData.name.normalizationVariants.withSpaces;
export const SEED_NAME_WITH_PUNCTUATION =
  seedData.name.normalizationVariants.withPunctuation;
export const SEED_NAME_ADMIN = seedData.nameAdmin.content;

export const SEED_DESCRIPTION_START =
  seedData.description.startDuplicate.content;
export const SEED_DESCRIPTION_START_PREFIX =
  seedData.description.startDuplicate.checkPrefix;

export const SEED_DESCRIPTION_MIDDLE_CONTEXT =
  seedData.description.middleOnly.content;
export const SEED_DESCRIPTION_MIDDLE_MARKER =
  seedData.description.middleOnly.marker;

export const SEED_DESCRIPTION_ADMIN =
  seedData.description.adminOwned.content;

export const SEED_DESCRIPTION_FILTER_CATEGORY =
  seedData.listingCooldown.descriptionFilterCategory;
export const SEED_DESCRIPTION_FILTER_TAG =
  seedData.listingCooldown.descriptionFilterTag;
export const SEED_NAME_TAG_ATTACH_CATEGORY =
  seedData.listingCooldown.nameTagAttachCategory;
export const SEED_NAME_TAG_FOR_ADD_NAMES =
  seedData.listingCooldown.nameTagForAddNames;
export const MIN_LISTING_DOCS_FOR_PAGINATION_COOLDOWN =
  seedData.listingCooldown.minDocsForPagination;

export function getPlaywrightProfileName(): string {
  return (
    process.env.PLAYWRIGHT_TEST_PROFILENAME ??
    "playwrighttest"
  ).toLowerCase();
}

export function getPlaywrightAdminCredentials():
  | { email: string; password: string }
  | null {
  const email =
    process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL ??
    seedData.admin.defaultEmail;
  const password =
    process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD ??
    seedData.admin.defaultPassword;
  if (!email || !password) return null;
  return { email: email.trim().toLowerCase(), password };
}

export function getPlaywrightAdminProfileName(): string {
  return (
    process.env.PLAYWRIGHT_TEST_ADMIN_PROFILENAME ??
    seedData.admin.defaultProfileName
  ).toLowerCase();
}

export function getPlaywrightAdminDisplayName(): string {
  return process.env.PLAYWRIGHT_TEST_ADMIN_NAME ?? seedData.admin.defaultName;
}
