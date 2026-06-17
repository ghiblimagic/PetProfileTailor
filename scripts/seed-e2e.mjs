/**
 * Seed MONGODB_URI_TEST for Playwright: user, admin, name, descriptions.
 * Content values come from e2e/fixtures/seed-data.json (same file Playwright tests import).
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedData = JSON.parse(
  readFileSync(join(__dirname, "../e2e/fixtures/seed-data.json"), "utf8"),
);

const DEFAULT_AVATAR = "/avatar-panda.png";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function normalizeString(content) {
  return content
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\w\s]/g, "")
    .toLowerCase();
}

async function upsertPasswordUser(users, fields) {
  const email = fields.email.trim().toLowerCase();
  const passwordHash = bcryptjs.hashSync(fields.password);
  const existing = await users.findOne({ email });

  const doc = {
    name: fields.name,
    email,
    profileName: fields.profileName.toLowerCase(),
    password: passwordHash,
    status: fields.status ?? "active",
    role: fields.role,
    bio: "",
    location: "",
    over13: true,
    profileImage: DEFAULT_AVATAR,
    updatedAt: new Date(),
  };

  if (existing) {
    await users.updateOne({ email }, { $set: doc });
    console.log(`Updated user: ${email} (role: ${fields.role})`);
    return existing._id;
  }

  await users.insertOne({ ...doc, createdAt: new Date() });
  console.log(`Created user: ${email} (role: ${fields.role})`);
  const created = await users.findOne({ email });
  return created._id;
}

async function upsertName(names, { content, createdBy }) {
  const normalizedContent = normalizeString(content);
  const result = await names.updateOne(
    { normalizedContent },
    {
      $set: {
        content,
        normalizedContent,
        createdBy,
        tags: [],
        likedByCount: 0,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  if (result.upsertedCount) {
    console.log(`Created name: ${content}`);
  } else {
    console.log(`Updated name: ${content}`);
  }
}

async function upsertDescription(descriptions, { content, createdBy }) {
  const normalizedContent = normalizeString(content).slice(0, 400);
  const result = await descriptions.updateOne(
    { content },
    {
      $set: {
        content,
        normalizedContent,
        createdBy,
        tags: [],
        likedByCount: 0,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  if (result.upsertedCount) {
    console.log(`Created description: ${content.slice(0, 48)}…`);
  } else {
    console.log(`Updated description: ${content.slice(0, 48)}…`);
  }
}

async function upsertDescriptionTag(descriptionTags, { tag, createdBy }) {
  const result = await descriptionTags.updateOne(
    { tag },
    {
      $set: { tag, createdBy, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  const doc = await descriptionTags.findOne({ tag });
  if (result.upsertedCount) {
    console.log(`Created description tag: ${tag}`);
  } else {
    console.log(`Updated description tag: ${tag}`);
  }
  return doc._id;
}

async function upsertNameTag(nameTags, { tag, createdBy }) {
  const result = await nameTags.updateOne(
    { tag },
    {
      $set: { tag, createdBy, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  const doc = await nameTags.findOne({ tag });
  if (result.upsertedCount) {
    console.log(`Created name tag: ${tag}`);
  } else {
    console.log(`Updated name tag: ${tag}`);
  }
  return doc._id;
}

async function upsertDescriptionCategory(descriptionCategories, {
  category,
  tags,
}) {
  const result = await descriptionCategories.updateOne(
    { category },
    { $set: { category, tags } },
    { upsert: true },
  );

  if (result.upsertedCount) {
    console.log(`Created description category: ${category}`);
  } else {
    console.log(`Updated description category: ${category}`);
  }
}

async function upsertNameCategory(nameCategories, { category, tags = [] }) {
  const result = await nameCategories.updateOne(
    { category },
    { $set: { category, tags } },
    { upsert: true },
  );

  if (result.upsertedCount) {
    console.log(`Created name category: ${category}`);
  } else {
    console.log(`Updated name category: ${category}`);
  }
}

async function seedBulkDescriptions(
  descriptions,
  { prefix, createdBy, targetCount },
) {
  const existing = await descriptions.countDocuments({
    content: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` },
  });
  const toCreate = Math.max(0, targetCount - existing);

  for (let i = 0; i < toCreate; i++) {
    const index = existing + i + 1;
    const content = `${prefix} ${String(index).padStart(3, "0")} with enough characters for validation here`;
    await upsertDescription(descriptions, { content, createdBy });
  }

  console.log(
    `Description bulk for pagination: ${existing} existing, ${toCreate} created (target ${targetCount})`,
  );
}

async function seedBulkNames(names, { prefix, createdBy, targetCount }) {
  const existing = await names.countDocuments({
    content: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` },
  });
  const toCreate = Math.max(0, targetCount - existing);

  for (let i = 0; i < toCreate; i++) {
    const index = existing + i + 1;
    const content = `${prefix}${String(index).padStart(3, "0")}`;
    await upsertName(names, { content, createdBy });
  }

  console.log(
    `Name bulk for pagination: ${existing} existing, ${toCreate} created (target ${targetCount})`,
  );
}

const uri = process.env.MONGODB_URI_TEST;
const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim().toLowerCase();
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
const name = process.env.PLAYWRIGHT_TEST_NAME ?? "Playwright Test";
const profileName = (
  process.env.PLAYWRIGHT_TEST_PROFILENAME ?? "playwrighttest"
).toLowerCase();

const adminEmail = (
  process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL ?? seedData.admin.defaultEmail
).trim().toLowerCase();
const adminPassword =
  process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD ?? seedData.admin.defaultPassword;
const adminName =
  process.env.PLAYWRIGHT_TEST_ADMIN_NAME ?? seedData.admin.defaultName;
const adminProfileName = (
  process.env.PLAYWRIGHT_TEST_ADMIN_PROFILENAME ??
  seedData.admin.defaultProfileName
).toLowerCase();

if (!uri) fail("MONGODB_URI_TEST is not set in .env / .env.local");
if (!email || !password) {
  fail("PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required");
}
if (password.length < 6) {
  fail("PLAYWRIGHT_TEST_PASSWORD must be at least 6 characters");
}
if (adminPassword.length < 6) {
  fail("PLAYWRIGHT_TEST_ADMIN_PASSWORD must be at least 6 characters (or use default)");
}

await mongoose.connect(uri);
const users = mongoose.connection.collection("users");
const names = mongoose.connection.collection("names");
const descriptions = mongoose.connection.collection("descriptions");
const descriptionTags = mongoose.connection.collection("descriptiontags");
const descriptionCategories =
  mongoose.connection.collection("descriptioncategories");
const nameCategories = mongoose.connection.collection("namecategories");
const nameTags = mongoose.connection.collection("nametags");

const minDocsForPagination = seedData.listingCooldown.minDocsForPagination;
const descriptionBulkPrefix = seedData.listingCooldown.descriptionBulkPrefix;
const nameBulkPrefix = seedData.listingCooldown.nameBulkPrefix;
const filterCategory = seedData.listingCooldown.descriptionFilterCategory;
const filterTag = seedData.listingCooldown.descriptionFilterTag;
const nameTagAttachCategory = seedData.listingCooldown.nameTagAttachCategory;
const nameTagForAddNames = seedData.listingCooldown.nameTagForAddNames;

const userId = await upsertPasswordUser(users, {
  email,
  password,
  name,
  profileName,
  role: "user",
});

const adminId = await upsertPasswordUser(users, {
  email: adminEmail,
  password: adminPassword,
  name: adminName,
  profileName: adminProfileName,
  role: "admin",
});

await upsertName(names, {
  content: seedData.name.content,
  createdBy: userId,
});

await upsertName(names, {
  content: seedData.nameAdmin.content,
  createdBy: adminId,
});

await upsertDescription(descriptions, {
  content: seedData.description.startDuplicate.content,
  createdBy: userId,
});

await upsertDescription(descriptions, {
  content: seedData.description.middleOnly.content,
  createdBy: userId,
});

await upsertDescription(descriptions, {
  content: seedData.description.adminOwned.content,
  createdBy: adminId,
});

const filterTagId = await upsertDescriptionTag(descriptionTags, {
  tag: filterTag,
  createdBy: adminId,
});

await upsertDescriptionCategory(descriptionCategories, {
  category: filterCategory,
  tags: [filterTagId],
});

const nameTagId = await upsertNameTag(nameTags, {
  tag: nameTagForAddNames,
  createdBy: adminId,
});

await upsertNameCategory(nameCategories, {
  category: nameTagAttachCategory,
  tags: [nameTagId],
});

await names.updateOne(
  { normalizedContent: normalizeString(seedData.name.content) },
  { $set: { tags: [nameTagId] } },
);
await descriptions.updateOne(
  { content: seedData.description.startDuplicate.content },
  { $set: { tags: [filterTagId] } },
);

const bannedEmail = (
  process.env.PLAYWRIGHT_TEST_BANNED_EMAIL ?? seedData.bannedUser.defaultEmail
)
  .trim()
  .toLowerCase();
const bannedPassword =
  process.env.PLAYWRIGHT_TEST_BANNED_PASSWORD ??
  seedData.bannedUser.defaultPassword;

await upsertPasswordUser(users, {
  email: bannedEmail,
  password: bannedPassword,
  name: seedData.bannedUser.defaultName,
  profileName: seedData.bannedUser.defaultProfileName,
  role: "user",
  status: "banned",
});

// Pagination cooldown tests need 51+ docs and a second SWR chunk (50 per page).
const fixtureDescriptionCount = 3;
const fixtureNameCount = 2;
await seedBulkDescriptions(descriptions, {
  prefix: descriptionBulkPrefix,
  createdBy: userId,
  targetCount: Math.max(0, minDocsForPagination - fixtureDescriptionCount),
});
await seedBulkNames(names, {
  prefix: nameBulkPrefix,
  createdBy: userId,
  targetCount: Math.max(0, minDocsForPagination - fixtureNameCount),
});

console.log(`Database: ${mongoose.connection.name}`);
console.log(`Fixture name duplicate variant: ${seedData.name.duplicateVariant}`);
console.log(
  `Fixture description start prefix: ${seedData.description.startDuplicate.checkPrefix}`,
);
console.log(
  `Fixture description middle marker: ${seedData.description.middleOnly.marker}`,
);

await mongoose.disconnect();
