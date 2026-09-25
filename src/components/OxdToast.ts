import { Locator, Page } from '@playwright/test';

/**
 * `.oxd-toast-content--success` / `.oxd-toast-content--error` / `.oxd-toast-content--info`.
 * Auto-dismisses in ~3-5s (CLAUDE.md §5.2, confirmed exploration.md §6/§8) — the
 * classic race is asserting AFTER the triggering click. The verbatim text pattern
 * ("Success" title / "Successfully Saved" / "Successfully Updated" / "Successfully
 * Deleted" body) was not documented in CLAUDE.md before M2 — exploration.md §2.1 is
 * the source for these exact strings; this class is where that observation is encoded
 * so no test file has to inline the class name.
 */
export class OxdToast {
  constructor(private readonly page: Page) {}

  private variantLocator(variant: 'success' | 'error' | 'info'): Locator {
    return this.page.locator(`.oxd-toast-content--${variant}`);
  }

  /**
   * Starts waiting for the toast BEFORE `action` runs (Promise.all), per CLAUDE.md
   * §5.2 — never `waitForTimeout` then assert. Returns the toast's text content.
   */
  async waitForSuccess(action: () => Promise<void>): Promise<string> {
    const toast = this.variantLocator('success');
    await Promise.all([toast.waitFor({ state: 'visible' }), action()]);
    return (await toast.textContent()) ?? '';
  }

  async waitForError(action: () => Promise<void>): Promise<string> {
    const toast = this.variantLocator('error');
    await Promise.all([toast.waitFor({ state: 'visible' }), action()]);
    return (await toast.textContent()) ?? '';
  }
}
