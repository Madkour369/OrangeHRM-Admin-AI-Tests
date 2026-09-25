import { Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { fieldError, fileUpload, labelledContainer } from '../../utils/fieldFactory';
import { OxdFileUpload } from '../../components/OxdFileUpload';
import { OxdToggleSwitch } from '../../components/OxdCheckbox';

/**
 * Admin > Corporate Branding. Behaviour methods only — no assertions, no raw
 * oxd- selectors, lazy locators.
 *
 * Route confirmed live 2026-09-24: `/web/index.php/admin/addTheme` (reached only
 * via the topbar's "More" menu). "Social Media Images" is a TOGGLE SWITCH
 * (`.oxd-switch-wrapper`, confirmed via direct DOM inspection — the accessibility
 * tree reports it as `checkbox` since a switch's underlying input is still
 * `role=checkbox`, but it is not `OxdCheckbox`'s component), same as
 * Organization > General Information's "Edit" control — reuses `OxdToggleSwitch`.
 */
export class CorporateBrandingPage extends BasePage {
  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/addTheme');
  }

  clientLogoUpload(): OxdFileUpload {
    return fileUpload(this.page, 'Client Logo');
  }

  /** The field-level message next to Client Logo (e.g. "Attachment Size Exceeded") — absent entirely for BUG-002's current symptom. */
  clientLogoError(): Locator {
    return fieldError(this.page, 'Client Logo');
  }

  clientLogoFilenameText(): Locator {
    return labelledContainer(this.page, 'Client Logo');
  }

  /** Confirmed live: exactly one toggle switch exists on this screen (Primary/Secondary/Font/Gradient are colour pickers, Client Logo/Banner/Login Banner are file uploads) — no extra scoping needed, matching OrgGeneralInformationPage's identical single-switch pattern. */
  get socialMediaImagesToggle(): OxdToggleSwitch {
    return new OxdToggleSwitch(this.page);
  }
}
