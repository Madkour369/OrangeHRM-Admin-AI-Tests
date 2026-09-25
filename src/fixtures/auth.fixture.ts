import { test as base, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/base/LoginPage';

/**
 * Credentials are configuration, not framework — read from the environment with no
 * literal fallback here. `playwright.config.ts` (project-level config, outside the
 * module-agnostic src/utils|components|fixtures|pages/base layers) sets a sane
 * default for local runs; this file only ever reads the two env vars and fails
 * loudly if they're somehow still unset, rather than silently hardcoding a value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. playwright.config.ts should default it for local runs — check it wasn't removed, or set it explicitly for this run.`);
  }
  return value;
}

const USERNAME = requireEnv('ORANGEHRM_USER');
const PASSWORD = requireEnv('ORANGEHRM_PASSWORD');

const STATE_DIR = path.join(process.cwd(), '.auth-state');

/**
 * Performs one real UI login (never an API/storageState shortcut as the first login
 * of a run — CLAUDE.md §2: "Login happens through the login form; storageState reuse
 * is permitted only after at least one real UI login has been recorded in the run.")
 * and returns the resulting storage state file path.
 */
async function realUiLogin(context: BrowserContext, statePath: string): Promise<void> {
  const page = await context.newPage();
  const login = new LoginPage(page);
  await login.goto();
  await login.login(USERNAME, PASSWORD);
  await page.waitForURL(/dashboard/, { timeout: 30_000 });
  await context.storageState({ path: statePath });
  await page.close();
}

/**
 * If a navigation lands on the login page (session expiry mid-test — confirmed a
 * real, observed occurrence this project: exploration.md FLAKE-004, an unprompted
 * session expiry mid-session with a clean redirect to /auth/login), re-authenticate
 * once via the real UI login form and return true. Returns false if the page was
 * never on the login screen (nothing to recover from).
 */
export async function reauthenticateIfExpired(page: Page): Promise<boolean> {
  if (!/\/auth\/login/.test(page.url())) return false;
  const login = new LoginPage(page);
  await login.login(USERNAME, PASSWORD);
  await page.waitForURL((url) => !/\/auth\/login/.test(url.toString()), { timeout: 30_000 });
  return true;
}

type AuthFixtures = {
  authenticatedPage: Page;
};

type AuthWorkerFixtures = {
  workerStorageStatePath: string;
};

export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
  // Worker-scoped: one real UI login per worker, reused by every test in that worker.
  workerStorageStatePath: [
    async ({ browser }, use, workerInfo) => {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      const statePath = path.join(STATE_DIR, `worker-${workerInfo.workerIndex}.json`);
      const context = await browser.newContext();
      await realUiLogin(context, statePath);
      await context.close();
      await use(statePath);
    },
    { scope: 'worker' },
  ],

  // Test-scoped page, pre-authenticated via the worker's saved storage state.
  authenticatedPage: async ({ browser, workerStorageStatePath }, use) => {
    const context = await browser.newContext({ storageState: workerStorageStatePath });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
