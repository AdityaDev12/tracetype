import { defineConfig } from '@playwright/test'

// Browser tests run against the production build (npm run build first).
// Locally they use the installed Google Chrome; in CI, Playwright's Chromium.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/tracetype/',
    channel: process.env.CI ? undefined : 'chrome',
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/tracetype/',
    reuseExistingServer: !process.env.CI,
  },
})
