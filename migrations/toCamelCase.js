// migrations/toCamelCase.js
import "dotenv/config";
import db from "../utils/db.js";
import User from "../models/User.js";
import { migrateField } from "./utils/migrateField.js";

(async () => {
  await db.connect();
  console.log("✅ Connected to MongoDB");

  try {
    // ----- Namess collection -----
    await migrateField(User, "profileimage", "profileImage", true);
  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    await db.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
})();
