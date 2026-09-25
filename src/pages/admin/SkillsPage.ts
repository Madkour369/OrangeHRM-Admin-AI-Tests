import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, waitForIdle, waitForFieldPopulated } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';
import { OxdToast } from '../../components/OxdToast';
import { OxdDialog } from '../../components/OxdDialog';

/**
 * Admin > Qualifications > Skills. Behaviour methods only — no assertions, no raw
 * oxd- selectors, lazy locators. Confirmed live 2026-09-24: identical shared
 * list-screen chrome to Job Titles/User Management (same `OxdTable`/`OxdDialog`/
 * `OxdToast`, no screen-specific quirks); fields are `Name*` (text) and
 * `Description` (textarea, placeholder "Type description here").
 */
export class SkillsPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewSkills');
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

  descriptionField(): Locator {
    return field(this.page, 'Description');
  }

  /** Fills Name (and saves). Returns the toast text — caller asserts the verbatim wording. */
  async createSkill(name: string, description?: string): Promise<string> {
    await this.nameField().fill(name);
    if (description !== undefined) await this.descriptionField().fill(description);
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

  async openEditByName(name: string): Promise<void> {
    const row = this.table.row(name);
    await this.table.editButton(row).click();
    await waitForIdle(this.page);
    await waitForFieldPopulated(this.page, 'Name');
  }

  async changeNameAndSave(newName: string): Promise<string> {
    return this.toast.waitForSuccess(async () => {
      await this.nameField().fill(newName);
      await this.saveButton.click();
    });
  }

  get dialog(): OxdDialog {
    return new OxdDialog(this.page);
  }

  async openDeleteDialogByName(name: string): Promise<void> {
    const row = this.table.row(name);
    await this.table.deleteButton(row).click();
  }

  async deleteByName(name: string): Promise<string> {
    await this.openDeleteDialogByName(name);
    return this.toast.waitForSuccess(async () => {
      await this.dialog.confirm();
    });
  }
}
