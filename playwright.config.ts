import { defineConfig, devices } from '@playwright/test';

// Playwright configuration for the F1 Dashboard visual + keyboard e2e suite.
//
// The suite runs against a local `vite preview` server (default 4173) so it
// tests the same production bundle that `npm run build` emits.
//
// Usage:
//   npx playwright test            # run all specs
//   npx playwright test -g 375     # run a specific viewport spec
//   npx playwright test --headed   # watch browser interactively
//
// Run `npm run build` first, then `npx playwright test`.

const port = Number(process.env.PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;

const viewports = [
  { name: '375px', width: 375, height: 667, isMobile: true },
  { name: '768px', width: 768, height: 1024, isMobile: true },
  { name: '1280px', width: 1280, height: 800, isMobile: false },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: viewports.map((v) => ({
    name: v.name,
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: v.width, height: v.height },
      isMobile: v.isMobile,
    },
  })),
  webServer: {
    command: `npx vite preview --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
