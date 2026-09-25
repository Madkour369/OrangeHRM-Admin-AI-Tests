import { Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { field } from '../../utils/fieldFactory';
import { OxdToggleSwitch } from '../../components/OxdCheckbox';

/**
 * Admin > Organization > General Information. Behaviour methods only — no
 * assertions, no raw oxd- selectors, lazy locators.
 *
 * Confirmed live 2026-09-24: every field is a `disabled` text input by default;
 * the "Edit" control is a TOGGLE SWITCH (`.oxd-switch-wrapper`), not a checkbox —
 * a new oxd trap, same underlying fix (click the wrapper, never the raw input),
 * added as `OxdToggleSwitch`. Toggling it removes `disabled` from every field and
 * reveals the Save button.
 */
export class OrgGeneralInformationPage extends BasePage {
  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewOrganizationGeneralInformation');
  }

  get editToggle(): OxdToggleSwitch {
    return new OxdToggleSwitch(this.page);
  }

  organizationNameField(): Locator {
    return field(this.page, 'Organization Name');
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  async enableEdit(): Promise<void> {
    await this.editToggle.turnOn();
  }
}
