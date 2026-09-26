import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { waitForIdle } from '../../utils/fieldFactory';
import { OxdTable } from '../../components/OxdTable';

/**
 * PIM > Employee List. Used by an Admin test (TC_ADM_NAT_010, BUG-001) that needs a
 * real employee to assign a Nationality to. Moved here from inline helpers in
 * nat.spec.ts (2026-09-26 review), which held raw oxd- table selectors, a `.first()`
 * and a hard-coded column position `.nth(2)`. Behaviour methods only: no assertions,
 * no raw oxd- selectors.
 */
export class EmployeeListPage extends BasePage {
  readonly table: OxdTable;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
  }

  /**
   * `waitForListRendered()` waits for the record-count header (or empty state) and then
   * for the first row's cells to populate. It replaces the old inline "first row
   * visible" wait, which covered the same spinner-gone-too-early race documented on
   * OxdTable.
   */
  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/pim/viewEmployeeList');
    await this.table.waitForListRendered();
  }

  async rowCount(): Promise<number> {
    return this.table.rows.count();
  }

  /**
   * Opens the employee in row `index` (a caller visits rows in turn; this never picks
   * "the nth" record as business data) and returns its empNumber, or null if the
   * response URL had none. Clicks the "First (& Middle) Name" cell, resolved by header
   * rather than position. It is the same cell the previous `.nth(2)` clicked.
   *
   * Waits on the `GET .../personal-details` response, armed before the click, because
   * the empNumber is only known after navigation (see PersonalDetailsPage.goto).
   */
  async openEmployeeAt(index: number): Promise<number | null> {
    const nameCell = await this.table.cell(this.table.rows.nth(index), 'First (& Middle) Name');
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => /\/pim\/employees\/\d+\/personal-details/.test(res.url()) && res.ok()),
      nameCell.click(),
    ]);
    const match = response.url().match(/employees\/(\d+)\/personal-details/);
    if (!match) return null;
    await waitForIdle(this.page);
    return parseInt(match[1], 10);
  }
}
