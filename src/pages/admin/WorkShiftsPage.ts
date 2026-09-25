import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, fieldValueText, waitForIdle } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';
import { OxdToast } from '../../components/OxdToast';
import { OxdDialog } from '../../components/OxdDialog';
import { OxdTimePicker } from '../../components/OxdTimePicker';

/**
 * Admin > Job > Work Shifts. Behaviour methods only — no assertions, no raw
 * oxd- selectors, lazy locators.
 *
 * Routes confirmed live 2026-09-24: list `/web/index.php/admin/workShift`, add
 * `/web/index.php/admin/saveWorkShifts`. From/To are `hh:mm` textboxes that
 * open an `OxdTimePicker` popup on click; Duration Per Day is read-only,
 * recomputed automatically.
 */
export class WorkShiftsPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/workShift');
    await this.table.waitForListRendered();
  }

  get addButton(): Locator {
    return this.page.getByRole('button', { name: 'Add' });
  }

  async openAddForm(): Promise<void> {
    await this.addButton.click();
    await waitForIdle(this.page);
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  shiftNameField(): Locator {
    return field(this.page, 'Shift Name');
  }

  /**
   * From/To live-confirmed 2026-09-25 (/code-review) to each have their own real
   * `<label>` inside a normal `.oxd-input-group` — the original positional
   * `.first()`/`.nth(1)` lookup (both textboxes share the identical accessible
   * name "hh:mm") worked but was needlessly fragile; label-anchored `field()`
   * resolves each uniquely and is the standard pattern used everywhere else.
   */
  private get fromTrigger(): Locator {
    return field(this.page, 'From');
  }

  private get toTrigger(): Locator {
    return field(this.page, 'To');
  }

  get fromTimePicker(): OxdTimePicker {
    return new OxdTimePicker(this.page, this.fromTrigger);
  }

  get toTimePicker(): OxdTimePicker {
    return new OxdTimePicker(this.page, this.toTrigger);
  }

  get durationPerDayText(): Locator {
    return fieldValueText(this.page, 'Duration Per Day');
  }

  fieldError(label: string): Locator {
    return fieldError(this.page, label);
  }

  async attemptSave(): Promise<void> {
    await this.saveButton.click();
  }

  async findRow(name: string): Promise<Locator> {
    return this.table.findRowAcrossPages(name);
  }

  get dialog(): OxdDialog {
    return new OxdDialog(this.page);
  }

  /** No W1 delete test case exists for this screen — this exists purely for test-data cleanup. */
  async deleteByName(name: string): Promise<string> {
    const row = await this.findRow(name);
    await this.table.deleteButton(row).click();
    return this.toast.waitForSuccess(async () => {
      await this.dialog.confirm();
    });
  }
}
