import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, dropdown, formContaining, waitForIdle } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';
import { OxdToast } from '../../components/OxdToast';
import { OxdDialog } from '../../components/OxdDialog';

/**
 * Admin > Job > Pay Grades. Behaviour methods only — no assertions, no raw
 * oxd- selectors, lazy locators.
 *
 * Routes confirmed live 2026-09-24: list `/web/index.php/admin/viewPayGrades`,
 * add `/web/index.php/admin/payGrade`. Saving a new Pay Grade immediately
 * redirects to its own Edit view (`/admin/payGrade/{id}`) — unlike Job
 * Titles/Skills/Nationalities, which stay on the list after Save. The
 * Currencies sub-form (Currency* dropdown, Minimum Salary, Maximum Salary)
 * renders its OWN "Save" button alongside the Pay Grade's own — both must be
 * scoped, never picked by an unscoped `getByRole('button', {name:'Save'})`
 * (confirmed live: an unscoped query hits a strict-mode violation).
 */
export class PayGradesPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewPayGrades');
    await this.table.waitForListRendered();
  }

  get addButton(): Locator {
    return this.page.getByRole('button', { name: 'Add' });
  }

  async openAddForm(): Promise<void> {
    await this.addButton.click();
    await waitForIdle(this.page);
  }

  nameField(): Locator {
    return field(this.page, 'Name');
  }

  private payGradeForm(): Locator {
    return formContaining(this.page, 'Name');
  }

  /**
   * Fills Name and saves. Returns once the Edit Pay Grade view has loaded
   * (confirmed by the "Currencies" heading appearing) — the redirect-on-save
   * behaviour means a toast wait is unreliable here (the new route can unmount
   * it before a `waitFor` catches it), so this uses the resulting page's own
   * content as the success signal instead.
   */
  async createPayGrade(name: string): Promise<void> {
    await this.nameField().fill(name);
    await this.payGradeForm().getByRole('button', { name: 'Save', exact: true }).click();
    await this.currenciesHeading.waitFor({ state: 'visible', timeout: 20_000 });
  }

  get currenciesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Currencies', exact: true });
  }

  get addCurrencyButton(): Locator {
    return this.page.getByRole('button', { name: 'Add' });
  }

  async openAddCurrencyForm(): Promise<void> {
    await this.addCurrencyButton.click();
    await waitForIdle(this.page);
  }

  private currencyForm(): Locator {
    return formContaining(this.page, 'Currency');
  }

  async selectCurrency(name: string): Promise<void> {
    await dropdown(this.page, 'Currency').select(name);
  }

  minimumSalaryField(): Locator {
    return field(this.page, 'Minimum Salary');
  }

  maximumSalaryField(): Locator {
    return field(this.page, 'Maximum Salary');
  }

  async saveCurrency(): Promise<void> {
    await this.currencyForm().getByRole('button', { name: 'Save', exact: true }).click();
  }

  fieldError(label: string): Locator {
    return fieldError(this.page, label);
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
