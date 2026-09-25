import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, dropdown, autocomplete, waitForIdle } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';
import { OxdToast } from '../../components/OxdToast';
import { OxdDialog } from '../../components/OxdDialog';
import { OxdAutocomplete } from '../../components/OxdAutocomplete';

export type NewUserInput = {
  userRole: 'Admin' | 'ESS';
  employeeSearchText: string;
  status: 'Enabled' | 'Disabled';
  username: string;
  password: string;
  confirmPassword?: string;
};

/**
 * Admin > User Management > Users. Behaviour methods only — no assertions, no raw
 * oxd- selectors (everything goes through fieldFactory or a component). Locators
 * are lazy getters, never resolved in the constructor.
 */
export class UserManagementPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewSystemUsers');
    // gotoPath only waits for the sidebar + spinner-gone, not the table's own
    // data (live-diagnosed 2026-09-24 on Job Titles — see
    // OxdTable.waitForListRendered; applies equally here for symmetry/safety,
    // even though every existing USR test happens to search before reading rows).
    await this.table.waitForListRendered();
  }

  // ---- Add form ----

  /**
   * The button's accessible name is NOT the exact string "Add" — its leading icon
   * glyph contributes an extra (non-whitespace, un-trimmable) character to the
   * computed name, confirmed live 2026-09-24 (accessibility snapshot rendered it as
   * `" Add"`). `exact: true` against `'Add'` therefore never matches; substring
   * matching does.
   */
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

  /**
   * Fills the Add User form and saves. Returns the toast text (caller asserts the
   * verbatim wording) and the exact employee name actually selected by the
   * autocomplete (never a hardcoded one — see OxdAutocomplete.selectFirstSuggestion).
   */
  async createUser(input: NewUserInput): Promise<{ toastText: string; employeeName: string }> {
    await dropdown(this.page, 'User Role').select(input.userRole);
    const employeeName = await this.employeeNameAutocomplete().selectFirstSuggestion(input.employeeSearchText);
    await dropdown(this.page, 'Status').select(input.status);
    await field(this.page, 'Username').fill(input.username);
    await field(this.page, 'Password').fill(input.password);
    await field(this.page, 'Confirm Password').fill(input.confirmPassword ?? input.password);
    const toastText = await this.toast.waitForSuccess(async () => {
      await this.saveButton.click();
    });
    return { toastText, employeeName };
  }

  private employeeNameAutocomplete(): OxdAutocomplete {
    return autocomplete(this.page, 'Employee Name');
  }

  async attemptDuplicateUsername(input: NewUserInput): Promise<void> {
    await dropdown(this.page, 'User Role').select(input.userRole);
    await this.employeeNameAutocomplete().selectFirstSuggestion(input.employeeSearchText);
    await dropdown(this.page, 'Status').select(input.status);
    await field(this.page, 'Username').fill(input.username);
    await field(this.page, 'Password').fill(input.password);
    await field(this.page, 'Confirm Password').fill(input.confirmPassword ?? input.password);
    await this.saveButton.click();
  }

  /**
   * Leaves the named field blank, fills everything else, then saves. `username` is
   * supplied by the caller (via the data fixture's `unique()`) rather than generated
   * here — this page object never mints its own untracked test data.
   */
  async submitAddFormWithEmptyField(
    emptyField: 'User Role' | 'Employee Name' | 'Status' | 'Username' | 'Password',
    username: string,
  ): Promise<void> {
    if (emptyField !== 'User Role') await dropdown(this.page, 'User Role').select('ESS');
    if (emptyField !== 'Employee Name') await this.employeeNameAutocomplete().selectFirstSuggestion('a');
    if (emptyField !== 'Status') await dropdown(this.page, 'Status').select('Enabled');
    if (emptyField !== 'Username') await field(this.page, 'Username').fill(username);
    if (emptyField !== 'Password') {
      await field(this.page, 'Password').fill('Passw0rd!2025');
      await field(this.page, 'Confirm Password').fill('Passw0rd!2025');
    }
    await this.saveButton.click();
  }

  /** Field-level error text under a labelled form field (e.g. "Required", "Already exists"). */
  fieldError(label: string): Locator {
    return fieldError(this.page, label);
  }

  /** Live (no-Save-needed) password strength/validation message. */
  async enterPasswordOnly(password: string): Promise<void> {
    await field(this.page, 'Password').fill(password);
    await field(this.page, 'Password').blur();
  }

  // ---- Search ----

  usernameSearchField(): Locator {
    return field(this.page, 'Username');
  }

  async searchByUsername(username: string): Promise<void> {
    await this.usernameSearchField().fill(username);
    await this.table.clickSearch();
    await waitForIdle(this.page);
  }

  async searchByUserRole(role: 'Admin' | 'ESS'): Promise<void> {
    await dropdown(this.page, 'User Role').select(role);
    await this.table.clickSearch();
    await waitForIdle(this.page);
  }

  async searchByStatus(status: 'Enabled' | 'Disabled'): Promise<void> {
    await dropdown(this.page, 'Status').select(status);
    await this.table.clickSearch();
    await waitForIdle(this.page);
  }

  async resetSearch(): Promise<void> {
    await this.table.clickReset();
    await waitForIdle(this.page);
  }

  /** All rows' [Username, Role, Status] triples currently rendered. */
  async allRowValues(): Promise<Array<{ username: string; role: string; status: string }>> {
    const rows = this.table.rows;
    const count = await rows.count();
    const out: Array<{ username: string; role: string; status: string }> = [];
    for (let i = 0; i < count; i++) {
      const [, username, role, , status] = await this.table.cellTexts(rows.nth(i));
      out.push({ username: (username ?? '').trim(), role: (role ?? '').trim(), status: (status ?? '').trim() });
    }
    return out;
  }

  // ---- Edit ----

  async openEditByUsername(username: string): Promise<void> {
    const row = this.table.row(username);
    await this.table.editButton(row).click();
    await waitForIdle(this.page);
  }

  async changeUserRoleAndSave(newRole: 'Admin' | 'ESS'): Promise<string> {
    return this.toast.waitForSuccess(async () => {
      await dropdown(this.page, 'User Role').select(newRole);
      await this.saveButton.click();
    });
  }

  // ---- Delete ----

  get dialog(): OxdDialog {
    return new OxdDialog(this.page);
  }

  async deleteByUsername(username: string): Promise<string> {
    const row = this.table.row(username);
    await this.table.deleteButton(row).click();
    return this.toast.waitForSuccess(async () => {
      await this.dialog.confirm();
    });
  }

  async openDeleteDialogByUsername(username: string): Promise<void> {
    const row = this.table.row(username);
    await this.table.deleteButton(row).click();
  }

  async selectRowCheckbox(username: string): Promise<void> {
    const row = this.table.row(username);
    await this.table.rowCheckboxWrapper(row).click();
  }

  get recordsSelectedHeader(): Locator {
    return this.page.getByText(/\(\d+\) Records? Selected/);
  }

  /**
   * Same icon-glyph pattern as `addButton` and `OxdDialog.confirmButton`: the real
   * accessible name is `" Delete Selected "` (confirmed live 2026-09-24 via
   * `ariaSnapshot`), so `exact: true` never matches.
   */
  get deleteSelectedButton(): Locator {
    return this.page.getByRole('button', { name: 'Delete Selected' });
  }

  async bulkDelete(): Promise<string> {
    await this.deleteSelectedButton.click();
    return this.toast.waitForSuccess(async () => {
      await this.dialog.confirm();
    });
  }

  // ---- FIND-004 regression guard ----

  async firstRowActionIconOrder(): Promise<string[]> {
    return this.table.actionIconOrder(this.table.rows.first());
  }
}
