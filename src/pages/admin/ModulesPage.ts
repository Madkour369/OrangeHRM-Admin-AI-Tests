import { BasePage } from '../base/BasePage';
import { OxdToggleSwitch } from '../../components/OxdCheckbox';

/**
 * Admin > Configuration > Modules. Read-only in this project (never toggled —
 * Article VI / the PRD's own "very high blast radius" classification for this
 * screen, per exploration.md §2.7). Route confirmed live 2026-09-24:
 * `/web/index.php/admin/viewModules`. Each module row is a TOGGLE SWITCH
 * (`.oxd-switch-wrapper`, confirmed via direct DOM inspection — same component
 * as Organization > General Information's "Edit" and Corporate Branding's
 * "Social Media Images"), not a checkbox.
 */
export class ModulesPage extends BasePage {
  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewModules');
  }

  private moduleRow(name: string) {
    return this.page.locator('.orangehrm-module-field-row').filter({ hasText: new RegExp(`^${name}$`) });
  }

  moduleToggle(name: string): OxdToggleSwitch {
    return new OxdToggleSwitch(this.moduleRow(name));
  }
}
