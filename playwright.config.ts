import { defineConfig, devices } from '@playwright/test';

/**
 * Demo login credential defaults. This is project-level configuration, not
 * framework code — the one place in this repo allowed to know the actual
 * credential value. `src/fixtures/auth.fixture.ts` only ever reads
 * `process.env.ORANGEHRM_USER`/`ORANGEHRM_PASSWORD` and fails loudly if unset; it
 * never hardcodes a fallback itself. Override either var in the shell/CI to point
 * at a different account without touching any framework file.
 */
process.env.ORANGEHRM_USER ??= 'Admin';
process.env.ORANGEHRM_PASSWORD ??= 'admin123';

/**
 * Constitution VI.2 / Risk R2: workers capped at 2 against the shared public demo,
 * retries 1 locally (2 in CI, per constitution — this config file covers the local/
 * default case). A test that only passes on retry is a healing candidate, not a
 * pass (CLAUDE.md §5.3) — /heal triages every retry-only pass, it isn't silently
 * accepted as green.
 *
 * `networkidle` is banned everywhere in this suite (CLAUDE.md §5.3 — this SPA's own
 * polling/analytics make it unreliable) — nothing in this config or in any page
 * object/test waits on it; all waits are element-state based.
 *
 * Only `chromium` is configured as a project: every observation this project has
 * ever made (M2 exploration, all of M4's manual execution) was against Chromium via
 * Playwright MCP. Firefox/WebKit were never exercised against this build, so
 * claiming cross-browser coverage here would assert something never observed.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: 'html',
  use: {
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
