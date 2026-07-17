import { defineConfig, devices } from '@playwright/test';

// E2E for the Genwel marketing/web app. Boots `next dev` on a dedicated port
// and drives real pages (smoke: home renders + navigation anchors exist).
// PLAYWRIGHT_PORT lets you target an already-running dev server (e.g. 3000)
// instead of spawning a second one — handy when Next's per-dir dev lock blocks
// a second instance. When set, the managed webServer is skipped.
// (Config mirrors titrra / salt-mammal.)
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const REUSE_EXTERNAL = Boolean(process.env.PLAYWRIGHT_PORT);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: REUSE_EXTERNAL
    ? undefined
    : {
        command: `pnpm dev --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
