import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { OxdTree } from '../../components/OxdTree';

/**
 * Admin > Organization > Structure. Read-only in this project — exploration.md
 * §2.3 judged mutation "Not recommended" on this shared instance (deleting a
 * parent cascades away its children, and there is no disposable seed data here).
 * Behaviour methods only — no assertions, no raw oxd- selectors, lazy locators.
 *
 * Route confirmed live 2026-09-24: `/web/index.php/admin/viewCompanyStructure`.
 */
export class OrgStructurePage extends BasePage {
  readonly tree: OxdTree;

  constructor(page: Page) {
    super(page);
    this.tree = new OxdTree(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewCompanyStructure');
  }

  async expand(name: string): Promise<void> {
    await this.tree.expand(name);
  }

  childNode(parentName: string, childName: string): Locator {
    return this.tree.childNode(parentName, childName);
  }
}
