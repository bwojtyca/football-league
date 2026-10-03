import { defineConfig, devices } from '@playwright/test';

/**
 * Scenarios on a phone, in Polish, against the production bundle built for the emulator
 * (`ng build -c production,emulator`) and the Firestore emulator started around the run by
 * `firebase emulators:exec` (see `.github/workflows/check.yml`).
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // One browser at a time: the scenarios share the emulator, each in a league of its own.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://127.0.0.1:4200',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    // The service worker would serve stale files between builds.
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'python3 -m http.server 4200 --bind 127.0.0.1 --directory ../dist/football-league/browser',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
  },
});
