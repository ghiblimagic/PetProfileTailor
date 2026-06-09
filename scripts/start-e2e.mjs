/**
 * Production server against MONGODB_URI_TEST (NextAuth + Mongoose use MONGODB_URI).
 * Build first with: pnpm build:e2e
 */
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

dotenv.config({ path: ".env.local" });
dotenv.config();

const testUri = process.env.MONGODB_URI_TEST;
if (!testUri) {
  console.error("MONGODB_URI_TEST is not set in .env / .env.local");
  process.exit(1);
}

const result = spawnSync("pnpm", ["start"], {
  stdio: "inherit",
  env: {
    ...process.env,
    MONGODB_URI: testUri,
    E2E_TEST_MODE: "true",
    NEXT_PUBLIC_E2E_TEST_MODE: "true",
  },
  shell: true,
});

process.exit(result.status ?? 1);
