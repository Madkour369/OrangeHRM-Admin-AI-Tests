import { Page, Locator } from '@playwright/test';

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
 * `requiredFieldErrors` below is a reviewed, narrow exception to "raw oxd-
 * selectors live only in components" (/code-review, 2026-09-25): it deliberately
 * returns however many error messages are visible ACROSS the whole 2-field form
 * at once (a caller counts them), not one field's own message — the shape
 * `fieldFactory.fieldError(scope, label)` is built for. This screen also
 * pre-dates `fieldFactory` (Phase 1) and has no `.oxd-input-group` wrapper on its
 * two fields for that helper to anchor to regardless. Wedging it into a
 * per-field helper it doesn't fit would be worse than this one documented line.
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

  /** Field-level "Required" messages, confirmed class `.oxd-input-field-error-message`. */
  get requiredFieldErrors(): Locator {
    return this.page.locator('.oxd-input-field-error-message');
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
