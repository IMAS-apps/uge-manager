import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for UGE Manager.
 *
 * NOTE: E2E tests run against the real Vite dev server.
 * Supabase calls are NOT mocked at this level — tests are designed
 * to be resilient by targeting UI structure rather than DB data.
 *
 * For a full integration against a Supabase staging environment, set:
 *   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.
 *
 * The tests at e2e/auth.spec.ts and e2e/navigation.spec.ts test the
 * login page and navigation guards which do not require authenticated state.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // JUnit report for GitHub Actions test summary
    ['junit', { outputFile: 'playwright-results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the Vite dev server before running E2E tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // Use test env vars if available, fallback to dummy ones so that
      // the Supabase JS client initializes without throwing, and allows
      // the UI components (like the login form) to render.
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy',
    },
  },
});
