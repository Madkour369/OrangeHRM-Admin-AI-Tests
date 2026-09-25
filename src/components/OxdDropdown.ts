import { Locator, Page, expect } from '@playwright/test';

/**
 * `.oxd-select-text` dropdown (User Role, Status, Country, Currency, LDAP
 * Implementation, ...). NOT a native <select> — Playwright's `selectOption()` throws
 * against it (CLAUDE.md §5.2). Confirmed exactly as CLAUDE.md predicted: click the
 * trigger, wait for `.oxd-select-dropdown`, click the option by exact text
 * (exploration.md §6, §8 — "No surprises").
 *
 * `container` is the label-scoped `.oxd-input-group`/`.oxd-form-row` handed in by
 * `fieldFactory.dropdown()` — this class is the only place `.oxd-select-text` and
 * `.oxd-select-dropdown` are referenced.
 */
export class OxdDropdown {
  private readonly page: Page;
  readonly trigger: Locator;

  constructor(private readonly container: Locator) {
    this.page = container.page();
    this.trigger = container.locator('.oxd-select-text');
  }

  /**
   * Opens the dropdown and selects by exact visible text. Exact matching is
   * mandatory (CLAUDE.md §5.1) — large option lists (Country ~240, Currency ~150)
   * contain near-duplicate substrings ("Guinea" / "Guinea-Bissau" /
   * "Equatorial Guinea"), confirmed as a real risk in exploration.md §6/§9.
   */
  async select(optionText: string): Promise<void> {
    await this.trigger.click();
    const listbox = this.page.locator('.oxd-select-dropdown');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: optionText, exact: true }).click();
    await expect(this.trigger).toHaveText(optionText);
  }

  /** Current selected text, for assertions or pre-condition checks. */
  async selectedText(): Promise<string> {
    return (await this.trigger.textContent())?.trim() ?? '';
  }
}
