import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, waitForIdle } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';
import { OxdToast } from '../../components/OxdToast';
import { OxdDialog } from '../../components/OxdDialog';

/**
 * Admin > Nationalities (reached via the topbar's "More" menu — confirmed live
 * 2026-09-24, not a direct top-level tab). Behaviour methods only — no
 * assertions, no raw oxd- selectors, lazy locators.
 *
 * Unlike Job Titles/Skills, this screen has NO search/filter panel and ~193
 * seeded records across 4 real pagination pages (confirmed live) — the only
 * screen in Admin with enough records to page through. Row lookups go through
 * `OxdTable.findRowAcrossPages()` rather than the plain `table.row()` other list
 * pages use, since a target row is often not on the current page.
 */
export class NationalitiesPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/nationality');
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

  nameField(): Locator {
    return field(this.page, 'Name');
  }

  /** Fills Name (and saves). Returns the toast text — caller asserts the verbatim wording. */
  async createNationality(name: string): Promise<string> {
    await this.nameField().fill(name);
    return this.toast.waitForSuccess(async () => {
      await this.saveButton.click();
    });
  }

  async submitEmptyName(): Promise<void> {
    await this.saveButton.click();
  }

  async cancelAdd(name: string): Promise<void> {
    await this.nameField().fill(name);
    await this.cancelButton.click();
  }

  fieldError(label: string): Locator {
    return fieldError(this.page, label);
  }

  /** Finds the row across all pages — see class comment. */
  async findRow(name: string): Promise<Locator> {
    return this.table.findRowAcrossPages(name);
  }

  async openDeleteDialogByName(name: string): Promise<void> {
    const row = await this.findRow(name);
    await this.table.deleteButton(row).click();
  }

  async deleteByName(name: string): Promise<string> {
    await this.openDeleteDialogByName(name);
    return this.toast.waitForSuccess(async () => {
      await this.dialog.confirm();
    });
  }

  get dialog(): OxdDialog {
    return new OxdDialog(this.page);
  }
}
