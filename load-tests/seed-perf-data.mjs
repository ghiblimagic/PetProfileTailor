import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });
dotenv.config();

const DEFAULT_RECORDS_PER_COLLECTION = 1000;
const MAX_RECORDS_PER_COLLECTION = 10000;
const PERF_USER_EMAIL = "k6-perf-user@example.invalid";

function getLocalPerformanceUri() {
  const uri = process.env.PERF_TEST_MONGODB_URI;
  if (!uri) {
    throw new Error("PERF_TEST_MONGODB_URI must be set explicitly.");
  }

  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("PERF_TEST_MONGODB_URI must be a valid MongoDB URI.");
  }

  if (
    parsed.protocol !== "mongodb:" ||
    !["localhost", "127.0.0.1"].includes(parsed.hostname)
  ) {
    throw new Error(
      "Performance seeding is restricted to a local MongoDB server (localhost or 127.0.0.1)."
    );
  }

  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (!/(?:^|[-_])perf$/i.test(databaseName)) {
    throw new Error(
      "The MongoDB database name must end in '-perf' or '_perf' (for example, homeward_tails_perf)."
    );
  }

  return { uri, databaseName };
}

function getRecordCount() {
  const rawCount = process.env.PERF_TEST_RECORDS;
  const count = rawCount ? Number(rawCount) : DEFAULT_RECORDS_PER_COLLECTION;

  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > MAX_RECORDS_PER_COLLECTION
  ) {
    throw new Error(
      `PERF_TEST_RECORDS must be an integer between 1 and ${MAX_RECORDS_PER_COLLECTION}.`
    );
  }

  return count;
}

function normalizeContent(content) {
  return content
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\w\s]/g, "")
    .toLowerCase();
}

async function seedUser(db) {
  const users = db.collection("users");
  const now = new Date();

  await users.updateOne(
    { email: PERF_USER_EMAIL },
    {
      $setOnInsert: {
        name: "k6 Performance Test User",
        profileName: "k6perfuser",
        email: PERF_USER_EMAIL,
        status: "active",
        role: "user",
        bio: "",
        location: "",
        over13: true,
        profileImage: "/avatar-panda.png",
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  const user = await users.findOne(
    { email: PERF_USER_EMAIL },
    { projection: { _id: 1 } }
  );
  if (!user) {
    throw new Error(
      "Could not find or create the local performance test user."
    );
  }
  return user._id;
}

async function seedCollection(
  db,
  collectionName,
  contentForIndex,
  userId,
  count
) {
  const collection = db.collection(collectionName);
  const now = new Date();
  const operations = Array.from({ length: count }, (_, index) => {
    const content = contentForIndex(index + 1);
    const filter =
      collectionName === "names"
        ? { normalizedContent: normalizeContent(content) }
        : { content };

    return {
      updateOne: {
        filter,
        update: {
          $set: {
            content,
            normalizedContent: normalizeContent(content),
            createdBy: userId,
            tags: [],
            likedByCount: 0,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    };
  });

  if (operations.length) {
    await collection.bulkWrite(operations, { ordered: true });
  }
}

function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/(mongodb:\/\/)[^@\s]+@/gi, "$1[redacted]@");
}

async function main() {
  const { uri, databaseName } = getLocalPerformanceUri();
  const count = getRecordCount();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(databaseName);
    const userId = await seedUser(db);

    await seedCollection(
      db,
      "names",
      (index) => `k6perfname${String(index).padStart(5, "0")}`,
      userId,
      count
    );
    await seedCollection(
      db,
      "descriptions",
      (index) =>
        `K6 performance test description ${String(index).padStart(
          5,
          "0"
        )} with enough content for listing`,
      userId,
      count
    );

    console.log(
      `Seeded ${count} names and ${count} descriptions in local database "${databaseName}". No existing documents were deleted.`
    );
    console.log(
      "To test the app, set MONGODB_URI to this same local database before starting Next.js."
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`Performance seed failed: ${sanitizeError(error)}`);
  process.exitCode = 1;
});
