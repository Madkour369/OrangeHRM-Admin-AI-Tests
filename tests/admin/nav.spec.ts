import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/base/LoginPage';
import { UserManagementPage } from '../../src/pages/admin/UserManagementPage';

/**
 * Login/session/navigation cases (Sub_Module: Login, Admin sidebar, Session).
 *
 * Deliberately uses plain `@playwright/test`, NOT this project's own
 * `src/fixtures` (`test`/`page`/`testData`) — that fixture chain authenticates
 * once per WORKER and reuses the resulting `storageState` across every test file
 * for efficiency. These cases test the login form and logout flow themselves; a
 * shared worker-scoped session is the wrong tool here, and a logout case run
 * against it would invalidate that session server-side for every other test that
 * reuses the same storageState afterward. Each test below gets Playwright's
 * ordinary fresh-context `page` and performs its own real UI login when it needs
 * one, fully independent of the shared worker fixture.
 */
test.describe('Login / Session / Navigation', () => {
  test('TC_ADM_NAV_001 - successful login routes to Dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('Admin', 'admin123');

    await page.waitForURL(/dashboard/);
    // Top bar shows the logged-in user's own display name — never asserted as a
    // specific string (this shared demo's employee display names drift, confirmed
    // repeatedly elsewhere in this project); just that the profile area (which
    // renders the name next to it) is present. Scoped to the banner landmark
    // (/code-review, 2026-09-25): the Dashboard's Buzz/Attendance/Leave widgets
    // can also render `alt="profile picture"` images — see
    // BasePage.openUserMenu()'s comment for the live evidence (up to 8 matches
    // observed unscoped on one real load).
    await expect(page.getByRole('banner').getByRole('img', { name: 'profile picture' })).toBeVisible();
  });

  test('TC_ADM_NAV_002 - invalid credentials rejected without leaking which field is wrong', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('Admin', 'wrongPass');

    await expect(loginPage.errorAlert).toHaveText('Invalid credentials');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('TC_ADM_NAV_003 - invalid credentials rejected without leaking which field is wrong (nonexistent username)', async ({ page }) => {
    // Promoted from Wave 2 (test_design_coverage.md §8): a P0 case is now Wave 1 by
    // rule. Parameter variant of TC_ADM_NAV_002 — same page object, same
    // assertions, only the credentials differ (a username that was never seeded,
    // rather than a wrong password for a real one).
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('ghost', 'admin123');

    await expect(loginPage.errorAlert).toHaveText('Invalid credentials');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('TC_ADM_NAV_004 - invalid credentials rejected without leaking which field is wrong (uppercase username) — KNOWN DEFECT BUG-003', async ({ page }) => {
    // Promoted from Wave 2 (test_design_coverage.md §8): a P0 case is now Wave 1 by
    // rule. Unlike NAV_002/003, this is NOT a pure parameter variant with the same
    // outcome: BUG-003 (exploration.md §5 Bug Register, M4-discovered, severity
    // Medium) confirmed live that login is username-case-INSENSITIVE — "ADMIN"
    // with the account's own correct password successfully authenticates as
    // "Admin", rather than being rejected. This is the product's ACTUAL
    // behaviour, asserted directly (not test.fixme()) so this test
    // regression-guards the defect itself, per CLAUDE.md §6.4's "assert the
    // ACTUAL buggy behaviour, never the desired-but-absent one" — same treatment
    // as TC_ADM_NAT_010 (BUG-001) and TC_ADM_BRD_001 (BUG-002). Do NOT change this
    // to assert an "Invalid credentials" rejection; that is the desired-but-absent
    // behaviour test_design.csv's Expected_Result explicitly warns against baking in.
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('ADMIN', 'admin123');

    await page.waitForURL(/dashboard/);
    await expect(page.getByRole('banner').getByRole('img', { name: 'profile picture' })).toBeVisible();
  });

  test('TC_ADM_NAV_005 - required-field validation, Username left empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitPartial({ password: 'admin123' });

    await expect(loginPage.requiredFieldErrors).toHaveCount(1);
    await expect(loginPage.requiredFieldErrors.first()).toHaveText('Required');
  });

  test('TC_ADM_NAV_007 - deep link while unauthenticated redirects to login', async ({ page }) => {
    await page.goto('/web/index.php/admin/viewSystemUsers');

    await expect(page).toHaveURL(/auth\/login/);
  });

  test('TC_ADM_NAV_008 - Admin top-tab "User Management" navigates to System Users', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await page.waitForURL(/dashboard/);

    // Start from a different Admin sub-screen so the navigation is a real
    // transition, not a no-op reload.
    const userPage = new UserManagementPage(page);
    await page.goto('/web/index.php/admin/viewJobTitleList');
    await userPage.openTopTabSubmenuItem('User Management', 'Users');

    await expect(page).toHaveURL(/viewSystemUsers/);
    // breadcrumbText() reads the DOM once and doesn't auto-retry like a Playwright
    // locator assertion — wait for a real breadcrumb heading first, or it can run
    // before the new screen has rendered and return an empty array.
    await expect(page.getByRole('banner').getByRole('heading', { level: 6 }).first()).toBeVisible();
    const breadcrumb = await userPage.breadcrumbText();
    // CSV says the breadcrumb "reads Admin" — live-confirmed 2026-09-24 this is a
    // two-segment breadcrumb ("Admin" / "User Management"), not a single-segment
    // one; asserting the first segment matches the CSV's intent without
    // overclaiming a shape that doesn't exist.
    expect(breadcrumb[0]).toBe('Admin');
  });

  test('TC_ADM_NAV_015 - logout invalidates the session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await page.waitForURL(/dashboard/);

    await loginPage.logout(page);

    await expect(page).toHaveURL(/auth\/login/);
    // Session invalidated server-side, not just a client-side route change —
    // confirmed by attempting a direct authenticated deep link afterward.
    await page.goto('/web/index.php/admin/viewSystemUsers');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('TC_ADM_NAV_016 - back-navigation after logout does not expose authenticated screens', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await page.waitForURL(/dashboard/);
    await page.goto('/web/index.php/admin/viewSystemUsers');

    await loginPage.logout(page);
    await expect(page).toHaveURL(/auth\/login/);

    await page.goBack();

    await expect(page).toHaveURL(/auth\/login/);
  });
});
