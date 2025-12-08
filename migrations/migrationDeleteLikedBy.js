// migrations/addOver13ToUsers.js
import "dotenv/config";
import db from "../utils/db.js";
import User from "../models/User.js";

await db.connect();
console.log("✅ Connected to MongoDB");

try {
  // Step 1: Add the over13 field where it's missing
  const result = await User.collection.updateMany(
    { over13: { $exists: false } }, // only update those missing it
    { $set: { over13: true } }, // or false, if you prefer
  );

  console.log(`✅ Added 'over13: true' to ${result.modifiedCount} users.`);

  // Step 2: Verify
  const missing = await User.collection.findOne({ over13: { $exists: false } });

  if (!missing) {
    console.log("✅ All user documents now have 'over13'.");
  } else {
    console.log("⚠️ Some users still missing 'over13':", missing._id);
  }
} catch (err) {
  console.error("❌ Migration failed:", err);
}

await db.disconnect();
console.log("✅ Disconnected from MongoDB");
