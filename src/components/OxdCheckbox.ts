import { Locator, Page } from '@playwright/test';

/**
 * The visually-hidden checkbox/radio trap. Confirmed exploration.md §2.1/§6:
 * clicking the raw `<input>` times out because `<i class="oxd-icon
 * oxd-checkbox-input-icon">` intercepts pointer events. Always click the
 * `.oxd-checkbox-wrapper` label instead.
 *
 * CLAUDE.md §5.2 only names this trap for checkboxes; exploration.md §6/§8
 * independently confirmed the identical trap on this build's RADIO buttons too
 * (Sending Method, Work Shift AM/PM) — clicking a radio's own wrapper/label
 * succeeded where the raw `input[value=...]` timed out. This class's `toggle`/
 * `check` methods are written generically enough to cover both, since the DOM
 * pattern and the fix are identical.
 */
export class OxdCheckbox {
  private readonly wrapper: Locator;

  /** `scope` should already be narrowed to the single checkbox's row/container. */
  constructor(scope: Locator) {
    this.wrapper = scope.locator('.oxd-checkbox-wrapper').first();
  }

  private get input(): Locator {
    return this.wrapper.locator('input');
  }

  async isChecked(): Promise<boolean> {
    return this.input.isChecked();
  }

  /** Clicks the wrapper (never the input directly) to toggle current state. */
  async toggle(): Promise<void> {
    await this.wrapper.click();
  }

  async check(): Promise<void> {
    if (!(await this.isChecked())) await this.toggle();
  }

  async uncheck(): Promise<void> {
    if (await this.isChecked()) await this.toggle();
  }
}

/**
 * A radio button selected by its visible label text, scoped to a container (e.g. the
 * "Sending Method" fieldset). Shares OxdCheckbox's wrapper-click trap and mitigation.
 */
export class OxdRadioGroup {
  constructor(private readonly scope: Locator) {}

  private optionWrapper(optionText: string): Locator {
    return this.scope.getByText(optionText, { exact: true });
  }

  async select(optionText: string): Promise<void> {
    await this.optionWrapper(optionText).click();
  }

  /** `inputSelector` targets the specific radio's underlying input, e.g. `input[value="smtp"]`. */
  async isSelected(inputSelector: string): Promise<boolean> {
    return this.scope.locator(inputSelector).isChecked();
  }
}

/**
 * A toggle switch (e.g. Organization > General Information's "Edit" control).
 * Confirmed live 2026-09-24: a visually distinct oxd component from the checkbox
 * (`.oxd-switch-wrapper`, not `.oxd-checkbox-wrapper`), but the same underlying
 * trap and fix — click the wrapper, never the raw `<input>`.
 */
export class OxdToggleSwitch {
  private readonly wrapper: Locator;

  /** `scope` is the Page (when the screen has exactly one switch) or an already-narrowed container. */
  constructor(scope: Page | Locator) {
    this.wrapper = scope.locator('.oxd-switch-wrapper').first();
  }

  private get input(): Locator {
    return this.wrapper.locator('input');
  }

  async isOn(): Promise<boolean> {
    return this.input.isChecked();
  }

  /** Confirmed real use: Configuration > Modules locks Admin/Pim Module on via a disabled switch. */
  async isDisabled(): Promise<boolean> {
    return this.input.isDisabled();
  }

  async toggle(): Promise<void> {
    await this.wrapper.click();
  }

  async turnOn(): Promise<void> {
    if (!(await this.isOn())) await this.toggle();
  }
}
