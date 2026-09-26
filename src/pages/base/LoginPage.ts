import { Page, Locator } from '@playwright/test';
import { allFieldErrors } from '../../utils/fieldFactory';

/**
 * The login screen. Deliberately does NOT extend BasePage — it is the one screen
 * with no sidebar/topbar (unauthenticated), so BasePage's `gotoPath` (which asserts
 * the sidebar is visible) does not apply here.
 *
 * All selectors below are live-verified (2026-09-24) against the real HTML, not
 * inferred from the accessibility tree alone:
 * - Error banner: `<div role="alert" class="oxd-alert oxd-alert--error">`, text in
 *   `.oxd-alert-content-text`.
 * - Field-level errors: `.oxd-input-field-error-message` (e.g. "Required").
 *
 * `requiredFieldErrors` delegates to `fieldFactory.allFieldErrors` (2026-09-26): the
 * raw oxd- selector that used to live here under a documented waiver now sits in the
 * shared helper layer, so this page object holds none.
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  get usernameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Username' });
  }

  get passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  get loginButton(): Locator {
    return this.page.getByRole('button', { name: 'Login' });
  }

  /** The verbatim-confirmed error alert (e.g. "Invalid credentials"), role="alert". */
  get errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  /** Field-level "Required" messages across the whole form (a caller counts them). */
  get requiredFieldErrors(): Locator {
    return allFieldErrors(this.page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login');
    // .waitFor(), not expect().toBeVisible() — page objects stay free of the
    // `expect` assertion API itself (/code-review, 2026-09-25; same fix as
    // BasePage.gotoPath()).
    await this.usernameInput.waitFor({ state: 'visible' });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Submits with whichever of username/password is provided, leaving the other blank. */
  async submitPartial(fields: { username?: string; password?: string }): Promise<void> {
    if (fields.username !== undefined) await this.usernameInput.fill(fields.username);
    if (fields.password !== undefined) await this.passwordInput.fill(fields.password);
    await this.loginButton.click();
  }

  /**
   * Scoped to `getByRole('banner')` (/code-review, 2026-09-25): the Dashboard's
   * Buzz/Attendance/Leave widgets can also render `alt="profile picture"` images
   * — see `BasePage.openUserMenu()`'s identical fix and its comment for the full
   * live evidence. Every test that logs out lands on the Dashboard first, so this
   * is not a hypothetical.
   */
  async logout(page: Page): Promise<void> {
    await page.getByRole('banner').getByRole('img', { name: 'profile picture' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
  }
}
