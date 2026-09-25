import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, dropdown, waitForIdle } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';
import { OxdToast } from '../../components/OxdToast';
import { OxdDialog } from '../../components/OxdDialog';

/**
 * Admin > Organization > Locations. Behaviour methods only — no assertions, no
 * raw oxd- selectors, lazy locators. Route and fields confirmed live 2026-09-24:
 * `/web/index.php/admin/viewLocations`; `Name*`, City, State/Province,
 * Zip/Postal Code, `Country*` (dropdown), Phone, Fax, Address, Notes.
 *
 * `Country*` genuinely blocks Save when left unselected (live-diagnosed 2026-09-24
 * — a screenshot of a stalled save showed a red "Required" error under Country;
 * the CSV's own Test_Data only names Name, which is incomplete for this form),
 * so `createLocation()` always selects one.
 */
export class LocationsPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewLocations');
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

  nameField(): Locator {
    return field(this.page, 'Name');
  }

  /** Fills Name + Country (both mandatory — see class comment) and saves. Returns the toast text. */
  async createLocation(name: string, country = 'United States'): Promise<string> {
    await this.nameField().fill(name);
    await dropdown(this.page, 'Country').select(country);
    return this.toast.waitForSuccess(async () => {
      await this.saveButton.click();
    });
  }

  async submitEmptyName(): Promise<void> {
    await this.saveButton.click();
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
