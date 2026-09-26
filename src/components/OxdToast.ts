import { Locator, Page } from '@playwright/test';

/**
 * `.oxd-toast-content--success` / `.oxd-toast-content--error` / `.oxd-toast-content--info`.
 * Auto-dismisses in ~3-5s (CLAUDE.md §5.2, confirmed exploration.md §6/§8) — the
 * classic race is asserting AFTER the triggering click. The verbatim text pattern
 * ("Success" title / "Successfully Saved" / "Successfully Updated" / "Successfully
 * Deleted" body) was not documented in CLAUDE.md. The Saved/Updated strings come from
 * M2/M5 observation. "Successfully Deleted" was never captured in M2; it was observed
 * live in M5 (2026-09-26, exploration.md Addendum A). This class is where those
 * observations are encoded, so no test file has to inline the class name.
 */
export class OxdToast {
  constructor(private readonly page: Page) {}

  private variantLocator(variant: 'success' | 'error' | 'info'): Locator {
    return this.page.locator(`.oxd-toast-content--${variant}`);
  }

  /**
   * The toast's message line only, not its title. Live-inspected 2026-09-26: the
   * toast holds two `<p>`s, `.oxd-text--toast-title` ("Success") and
   * `.oxd-text--toast-message` (e.g. "Successfully Deleted"), so the container's own
   * textContent is the unreadable concatenation "SuccessSuccessfully Deleted".
   * Returning the message alone lets callers assert the verbatim string with toBe().
   */
  private async messageText(toast: Locator): Promise<string> {
    return ((await toast.locator('.oxd-text--toast-message').textContent()) ?? '').trim();
  }

  /**
   * Starts waiting for the toast BEFORE `action` runs (Promise.all), per CLAUDE.md
   * §5.2 — never `waitForTimeout` then assert. Returns the toast's message line.
   */
  async waitForSuccess(action: () => Promise<void>): Promise<string> {
    const toast = this.variantLocator('success');
    await Promise.all([toast.waitFor({ state: 'visible' }), action()]);
    return this.messageText(toast);
  }

  async waitForError(action: () => Promise<void>): Promise<string> {
    const toast = this.variantLocator('error');
    await Promise.all([toast.waitFor({ state: 'visible' }), action()]);
    return this.messageText(toast);
  }

  /**
   * How many success toasts are attached right now: a single, non-retrying read that
   * cannot throw. Callers assert it is 0 after a blocked submission. This replaces a
   * test-side `expect(locator).toHaveCount(0)`, which retried for up to the expect
   * timeout. Because toasts auto-dismiss in ~3-5s, that retrying form would also pass
   * if a success toast HAD appeared and then faded.
   */
  async successToastCount(): Promise<number> {
    return this.variantLocator('success').count();
  }
}
