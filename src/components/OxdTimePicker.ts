import { Locator, Page, expect } from '@playwright/test';

/**
 * The Work Shift hour/minute/AM-PM time picker (`hh:mm` textbox trigger opens a
 * `role=alert` popup). Confirmed live 2026-09-24 via direct DOM inspection:
 * popup is `.oxd-time-picker`, hour/minute are `.oxd-time-hour-input-text` /
 * `.oxd-time-minute-input-text`, AM/PM are `input[name=am]`/`input[name=pm]`
 * (matches exploration.md §6's Locator Risk Register entry exactly).
 *
 * A genuinely NEW variant of the checkbox/radio-wrapper trap, discovered live
 * 2026-09-25: for every other radio/checkbox in this project, the ICON
 * intercepts the WRAPPER's click, so the fix is "click the wrapper, not the
 * input." Here it is the OPPOSITE — clicking the radio's own
 * `<label for="pm">PM</label>` text fails because the raw
 * `<input name="pm">` itself intercepts the pointer event (confirmed via the
 * exact Playwright retry-log wording: "intercepts pointer events" on the
 * input, not an icon). The fix here is therefore to click the `<input>`
 * directly with `force: true`, the reverse of the usual mitigation — not
 * interchangeable with `OxdRadioGroup`, which assumes the opposite trap.
 */
export class OxdTimePicker {
  constructor(
    private readonly page: Page,
    private readonly triggerField: Locator,
  ) {}

  private get popup(): Locator {
    return this.page.getByRole('alert');
  }

  /**
   * Opens the picker, sets hour/minute/meridiem, then commits by clicking
   * elsewhere in the form (exploration.md §6: the popup only exists while its
   * trigger field is focused, and clicking outside closes it and commits the
   * shown value) — `commitElsewhere` is a locator outside the picker, e.g. the
   * Shift Name field.
   */
  async setTime(hour: string, minute: string, meridiem: 'AM' | 'PM', commitElsewhere: Locator): Promise<void> {
    await this.triggerField.click();
    await expect(this.popup).toBeVisible();
    await this.popup.locator('.oxd-time-hour-input-text').fill(hour);
    await this.popup.locator('.oxd-time-minute-input-text').fill(minute);
    await this.popup.locator(`input[name=${meridiem.toLowerCase()}]`).click({ force: true });
    await commitElsewhere.click();
  }
}
