import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({ path: ".env.local" });
dotenv.config();

const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;

/** Playwright webServer.env requires Record<string, string> — no undefined values. */
function envForWebServer(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  const mongoUri = process.env.MONGODB_URI_TEST ?? process.env.MONGODB_URI;
  if (mongoUri) {
    env.MONGODB_URI = mongoUri;
  }
  env.E2E_TEST_MODE = "true";
  env.NEXT_PUBLIC_E2E_TEST_MODE = "true";
  return env;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          // Build must include NEXT_PUBLIC_E2E_TEST_MODE for contact validation tests
          command: "pnpm build && pnpm start",
          url: "http://localhost:3000",
          timeout: 360_000,
          reuseExistingServer: !process.env.CI,
          env: envForWebServer(),
        },
      }),
});
