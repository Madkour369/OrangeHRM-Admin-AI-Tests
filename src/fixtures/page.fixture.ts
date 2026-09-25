import { Page, expect } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { waitForIdle } from '../utils/fieldFactory';

/**
 * Module-agnostic: this file does not navigate to any specific module's screen. It
 * only guarantees the authenticated page has landed somewhere stable (the
 * post-login dashboard) with the sidebar rendered, before handing control to a page
 * object under src/pages/<module>/ — which is where module-specific navigation
 * belongs.
 */
type PageFixtures = {
  page: Page;
};

export const test = authTest.extend<PageFixtures>({
  page: async ({ authenticatedPage }, use) => {
    if (!/dashboard/.test(authenticatedPage.url())) {
      await authenticatedPage.goto('/web/index.php/dashboard/index');
    }
    await expect(authenticatedPage.getByRole('navigation', { name: 'Sidepanel' })).toBeVisible();
    await waitForIdle(authenticatedPage);
    await use(authenticatedPage);
  },
});

export { expect } from '@playwright/test';
export { reauthenticateIfExpired } from './auth.fixture';
