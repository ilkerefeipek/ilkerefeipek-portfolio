// @ts-check
import { defineConfig, devices } from '@playwright/test';

const PORT = 8765;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Sprint 20: PDF generator is a maintenance utility, not a regression test.
  // Run explicitly: `npx playwright test e2e/generate-pdfs.spec.ts --project=chromium-desktop`
  testIgnore: [/generate-pdfs\.spec/],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Single Python http.server can choke on >2 concurrent connections; cap workers.
  workers: process.env.CI ? 1 : 2,
  snapshotPathTemplate: '{testDir}/screenshots/{arg}{ext}',
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  outputDir: './test-results',

  use: {
    baseURL: BASE_URL,
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  },

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, threshold: 0.2 },
    timeout: 5_000,
  },

  projects: [
    // Sprint 9: audit / accessibility / dead-links specs run on chromium-desktop
    // ONLY (single-project sufficient — no browser-dependent semantics).
    // Non-desktop projects ignore them via testIgnore → eliminates ~150 skip outcomes.
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'chromium-tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
      testIgnore: [/audit\//, /accessibility\.spec/, /dead-links\.spec/, /generate-pdfs\.spec/],
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 667 } },
      testIgnore: [/audit\//, /accessibility\.spec/, /dead-links\.spec/, /generate-pdfs\.spec/],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
      testIgnore: [/audit\//, /accessibility\.spec/, /dead-links\.spec/, /generate-pdfs\.spec/],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
      testIgnore: [/audit\//, /accessibility\.spec/, /dead-links\.spec/, /generate-pdfs\.spec/],
    },
  ],

  webServer: {
    command: `python -m http.server ${PORT} --bind 127.0.0.1 --directory ..`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
