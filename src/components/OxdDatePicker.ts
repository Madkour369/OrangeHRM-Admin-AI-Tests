import { Locator, Page } from '@playwright/test';

/**
 * Date input fields. Confirmed exploration.md §2.7/§6/§8 (independently corroborated,
 * not just CLAUDE.md's prediction): this build's default format is `yyyy-dd-mm`, NOT
 * ISO `yyyy-mm-dd` — Localization's own live-example rendering proved it
 * (`yyyy-dd-mm ( 2026-20-09 )` for 2026-09-20). Typing an ISO-ordered date silently
 * produces the wrong date; there is no client-side format validation to catch it.
 *
 * No W1 case exercises a date-entry flow directly (Localization's W1 case,
 * TC_ADM_CFG_008, only reads the live-example text) — this component exists per the
 * build order ("components exist before page objects") and is ready for W2 cases
 * that do.
 */
export class OxdDatePicker {
  readonly input: Locator;

  constructor(scope: Locator | Page) {
    this.input = scope.getByPlaceholder('yyyy-dd-mm');
  }

  /** Formats and types a date as `yyyy-dd-mm` — never assume ISO ordering (CLAUDE.md §5.1, confirmed). */
  async fill(date: { year: number; month: number; day: number }): Promise<void> {
    const yyyy = String(date.year).padStart(4, '0');
    const dd = String(date.day).padStart(2, '0');
    const mm = String(date.month).padStart(2, '0');
    await this.input.fill(`${yyyy}-${dd}-${mm}`);
  }
}
