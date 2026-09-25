import { Locator, Page, expect } from '@playwright/test';

/**
 * Debounced remote-hint autocomplete (Employee Name, Supervisor Name, Assigned
 * Employees). Confirmed exploration.md §6/§8: placeholder is "Type for hints...",
 * ~1-1.5s debounce was sufficient in every M2 observation. The empty-match state
 * renders a real, disabled "No Records Found" option — a naive "wait for any
 * option" would wrongly treat that as a hit, so callers must always name the exact
 * option they expect.
 *
 * `container` is the label-scoped container handed in by `fieldFactory.autocomplete()`
 * — this class is the only place the debounce-wait/option-scoping logic lives.
 */
export class OxdAutocomplete {
  private readonly page: Page;
  readonly input: Locator;

  constructor(private readonly container: Locator) {
    this.page = container.page();
    this.input = container.getByPlaceholder('Type for hints...');
  }

  /**
   * Types partial text and clicks the exact matching suggestion once it renders.
   * Never `fill()` and tab away (CLAUDE.md §5.2) — the option must be explicitly
   * awaited and selected, or the field is left "Invalid" (confirmed exploration.md §2.1).
   */
  async selectSuggestion(typeText: string, optionText: string): Promise<void> {
    await this.input.fill(typeText);
    const option = this.page.getByRole('option', { name: optionText, exact: true });
    await expect(option).toBeVisible();
    await option.click();
  }

  /**
   * Types text expected to match nothing and asserts the disabled "No Records
   * Found" placeholder option appears (confirmed verbatim, exploration.md §2.1) —
   * used by negative cases that deliberately leave the field unresolved.
   */
  async expectNoSuggestions(typeText: string): Promise<void> {
    await this.input.fill(typeText);
    await expect(this.page.getByRole('option', { name: 'No Records Found' })).toBeVisible();
  }

  /**
   * Types a broad substring and selects whichever real suggestion appears first,
   * returning the employee name actually applied to the input. Used where a test
   * needs "some existing employee", not a specific named one — this shared,
   * seeded-data demo has its employee list drift under concurrent third-party use
   * (confirmed repeatedly across M2 and M4), so asserting a specific employee exists
   * would be exactly the kind of non-owned-record dependency Constitution Article VI
   * forbids.
   *
   * Live-diagnosed 2026-09-24 (Add User form): between "No Records Found" and the
   * real results, the dropdown briefly renders a THIRD, distinct placeholder option
   * — literally "Searching...." — while the debounced request is in flight. The
   * original filter only excluded "No Records Found", so under real timing this
   * could resolve `options.first()` to the "Searching...." placeholder and click it;
   * nothing happens on click (it isn't a real, selectable suggestion), so the field
   * silently stayed on its raw typed text and the form later failed validation
   * ("Invalid") with no exception anywhere in this method — reproduced live via the
   * MCP browser, not guessed. Fixed by excluding that placeholder too, and by
   * reading the input's actual applied value AFTER the click (ground truth) instead
   * of a `textContent()` read taken before it, which can describe an option that the
   * list re-rendered away from by the time the click lands.
   */
  async selectFirstSuggestion(typeText: string): Promise<string> {
    await this.input.fill(typeText);
    const options = this.page.getByRole('option').filter({ hasNotText: /No Records Found|Searching/ });
    await expect(options.first()).toBeVisible();
    await options.first().click();
    await expect(this.input).not.toHaveValue(typeText);
    return (await this.input.inputValue()).trim();
  }
}
