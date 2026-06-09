/**
 * Run Playwright without starting webServer (expects app on localhost:3000).
 * Build first: E2E_TEST_MODE=true NEXT_PUBLIC_E2E_TEST_MODE=true pnpm build && pnpm start
 */
import { spawnSync } from "node:child_process";

process.env.PLAYWRIGHT_SKIP_WEBSERVER = "1";

const result = spawnSync("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
