import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { dropdown, formContaining, waitForIdle } from '../../utils/fieldFactory';
import { OxdToast } from '../../components/OxdToast';

/**
 * PIM > Employee > Personal Details, limited to the Nationality field that
 * TC_ADM_NAT_010 (BUG-001) needs. Moved here from inline helpers in nat.spec.ts
 * (2026-09-26 review), which held raw `.oxd-form` and `.oxd-toast-content--success`
 * selectors. Behaviour methods only: no assertions, no raw oxd- selectors.
 */
export class PersonalDetailsPage extends BasePage {
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.toast = new OxdToast(page);
  }

  /**
   * Live-diagnosed 2026-09-24: neither `waitForIdle()` nor waiting for the Nationality
   * dropdown trigger is reliable here. This route does a fast initial render before its
   * real data arrives, so a one-shot visibility check can catch the flicker too early.
   * Waiting for the specific `GET .../personal-details` response (confirmed in the
   * browser's network log as the call the form loads from), armed before navigation,
   * is a precise signal instead.
   */
  async goto(empNumber: number): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((res) => res.url().includes(`/pim/employees/${empNumber}/personal-details`) && res.ok()),
      this.page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${empNumber}`),
    ]);
    await waitForIdle(this.page);
  }

  async selectedNationality(): Promise<string> {
    return (await dropdown(this.page, 'Nationality').selectedText()).trim();
  }

  /** The Save button of the form that holds the Nationality field (the page has several forms). */
  private get personalDetailsSaveButton(): Locator {
    return formContaining(this.page, 'Nationality').getByRole('button', { name: 'Save', exact: true });
  }

  /**
   * Selects `name` and saves, waiting for the success toast armed before the click.
   * Live-diagnosed: this form's spinner can be gone (or never shown) well before the
   * save persists, so a caller that navigates away straight after could race the save.
   * Returns the toast's message line.
   */
  async saveNationality(name: string): Promise<string> {
    await dropdown(this.page, 'Nationality').select(name);
    return this.toast.waitForSuccess(async () => {
      await this.personalDetailsSaveButton.click();
    });
  }
}
