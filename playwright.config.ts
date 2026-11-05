import { defineConfig, devices } from '@playwright/test';

/** End-to-end and visual checks against the production build (so the CSP is in force). */
export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/.report' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@phone/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'phone', grepInvert: /@desktop/, use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npx vp preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
