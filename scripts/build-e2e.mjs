import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

dotenv.config({ path: ".env.local" });
dotenv.config();

const result = spawnSync("pnpm", ["build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    E2E_TEST_MODE: "true",
    NEXT_PUBLIC_E2E_TEST_MODE: "true",
  },
  shell: true,
});

process.exit(result.status ?? 1);
