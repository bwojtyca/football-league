import { defineConfig, devices } from '@playwright/test';

/**
 * Reads what the live app shows (`APP_URL`, by default the published app), in Polish on a
 * phone, without writing anything (see `.github/workflows/snapshot.yml`).
 */
export default defineConfig({
  testDir: './snapshot',
  outputDir: './test-results',
  timeout: 600_000,
  expect: { timeout: 60_000 },
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Pixel 7'],
    baseURL: process.env['APP_URL'] ?? 'https://bwojtyca.github.io/football-league/',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    serviceWorkers: 'block',
  },
});
