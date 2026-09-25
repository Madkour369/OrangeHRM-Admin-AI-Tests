import { Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { dropdown } from '../../utils/fieldFactory';

/**
 * Admin > Configuration > Localization. Read-only in this project (not
 * mutated by any W1 case). Route confirmed live 2026-09-24:
 * `/web/index.php/admin/localization`.
 */
export class LocalizationPage extends BasePage {
  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/localization');
  }

  /** The Date Format dropdown's trigger — its own text includes the live example, e.g. "yyyy-dd-mm ( 2026-25-09 )". */
  dateFormatTrigger(): Locator {
    return dropdown(this.page, 'Date Format').trigger;
  }
}
