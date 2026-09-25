import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, waitForIdle, waitForFieldPopulated } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';
import { OxdToast } from '../../components/OxdToast';
import { OxdDialog } from '../../components/OxdDialog';

/**
 * Admin > Job > Job Titles. Behaviour methods only — no assertions, no raw oxd-
 * selectors (everything goes through fieldFactory or a component). Locators are
 * lazy getters, never resolved in the constructor.
 *
 * Confirmed live 2026-09-24: same shared oxd list-screen chrome as User
 * Management (`.orangehrm-paper-container`/`.oxd-table`, icon-glyph " Add "
 * button, generic delete-confirm dialog) — no screen-specific quirks found beyond
 * the field set itself. Unlike Users, this list has no search/filter panel.
 */
export class JobTitlesPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewJobTitleList');
    // gotoPath only waits for the sidebar + spinner-gone, not the table's own
    // data (live-diagnosed 2026-09-24 — see OxdTable.waitForListRendered).
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

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel', exact: true });
  }

  jobTitleField(): Locator {
    return field(this.page, 'Job Title');
  }

  /** Fills Job Title (and saves). Returns the toast text — caller asserts the verbatim wording. */
  async createJobTitle(jobTitle: string): Promise<string> {
    await this.jobTitleField().fill(jobTitle);
    return this.toast.waitForSuccess(async () => {
      await this.saveButton.click();
    });
  }

  async submitEmptyJobTitle(): Promise<void> {
    await this.saveButton.click();
  }

  async cancelAdd(jobTitle: string): Promise<void> {
    await this.jobTitleField().fill(jobTitle);
    await this.cancelButton.click();
  }

  fieldError(label: string): Locator {
    return fieldError(this.page, label);
  }

  async openEditByTitle(jobTitle: string): Promise<void> {
    const row = this.table.row(jobTitle);
    await this.table.editButton(row).click();
    await waitForIdle(this.page);
    // waitForIdle alone isn't enough here — live-diagnosed 2026-09-24, see
    // waitForFieldPopulated's own comment.
    await waitForFieldPopulated(this.page, 'Job Title');
  }

  async changeJobTitleAndSave(newTitle: string): Promise<string> {
    return this.toast.waitForSuccess(async () => {
      await this.jobTitleField().fill(newTitle);
      await this.saveButton.click();
    });
  }

  get dialog(): OxdDialog {
    return new OxdDialog(this.page);
  }

  async openDeleteDialogByTitle(jobTitle: string): Promise<void> {
    const row = this.table.row(jobTitle);
    await this.table.deleteButton(row).click();
  }

  async deleteByTitle(jobTitle: string): Promise<string> {
    await this.openDeleteDialogByTitle(jobTitle);
    return this.toast.waitForSuccess(async () => {
      await this.dialog.confirm();
    });
  }
}
