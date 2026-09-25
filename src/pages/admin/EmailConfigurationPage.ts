import { Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field, fieldError, radioGroup, waitForIdle } from '../../utils/fieldFactory';

/**
 * Admin > Configuration > Email Configuration. Behaviour methods only — no
 * assertions, no raw oxd- selectors, lazy locators.
 *
 * Route confirmed live 2026-09-24: `/web/index.php/admin/listMailConfiguration`.
 * exploration.md's BUG-006 / this project's own M4 execution (NEWBUG-BRDCFG-2)
 * both document an intermittent field-visibility desync on this screen — the
 * `Sendmail` radio can be the checked value while SMTP-only fields still render
 * visible. `selectSendingMethod()` always clicks the target option directly
 * (never assumes the current visible-field state matches the checked radio), so
 * a caller that always explicitly selects before observing is immune to this —
 * exactly the mitigation the M4 batch itself used successfully.
 */
export class EmailConfigurationPage extends BasePage {
  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/listMailConfiguration');
  }

  async selectSendingMethod(method: 'SECURE SMTP' | 'SMTP' | 'Sendmail'): Promise<void> {
    await radioGroup(this.page, 'Sending Method').select(method);
  }

  get pathToSendmailText(): Locator {
    return this.page.getByText('/usr/sbin/sendmail -bs', { exact: true });
  }

  smtpHostField(): Locator {
    return field(this.page, 'SMTP Host');
  }

  smtpPortField(): Locator {
    return field(this.page, 'SMTP Port');
  }

  smtpUserField(): Locator {
    return field(this.page, 'SMTP User');
  }

  smtpPasswordField(): Locator {
    return field(this.page, 'SMTP Password');
  }

  async selectAuthentication(value: 'Yes' | 'No'): Promise<void> {
    await radioGroup(this.page, 'Use SMTP Authentication').select(value);
  }

  fieldError(label: string): Locator {
    return fieldError(this.page, label);
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  /** Client-side validation only — confirmed live no POST/PUT request fires when required fields are blank. */
  async attemptSave(): Promise<void> {
    await this.saveButton.click();
    await waitForIdle(this.page);
  }
}
