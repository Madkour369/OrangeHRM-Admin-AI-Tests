import { test, expect } from '../../src/fixtures';
import { OrgGeneralInformationPage } from '../../src/pages/admin/OrgGeneralInformationPage';
import { LocationsPage } from '../../src/pages/admin/LocationsPage';
import { OrgStructurePage } from '../../src/pages/admin/OrgStructurePage';

/** Idempotent: safe to call whether or not the record was already deleted by the test itself. */
async function ensureLocationDeleted(locationsPage: LocationsPage, name: string): Promise<void> {
  await locationsPage.goto();
  const row = await locationsPage.findRow(name);
  if ((await row.count()) === 0) return;
  await locationsPage.deleteByName(name);
}

test.describe('Admin > Organization', () => {
  test('TC_ADM_ORG_001 - General Information fields are read-only until Edit is toggled', async ({ page }) => {
    const orgPage = new OrgGeneralInformationPage(page);
    await orgPage.goto();

    await expect(orgPage.organizationNameField()).toBeDisabled();
    await expect(orgPage.saveButton).toHaveCount(0);

    await orgPage.enableEdit();

    await expect(orgPage.organizationNameField()).toBeEnabled();
    await expect(orgPage.saveButton).toBeVisible();
    // No field value changed and Save never clicked — read-only observation only,
    // consistent with exploration.md §2.3's own M2 approach on this shared record.
  });

  test.describe('Locations', () => {
    test('TC_ADM_ORG_006 - create a Locations record', async ({ page, testData }) => {
      const locationsPage = new LocationsPage(page);
      await locationsPage.goto();

      const name = testData.unique('location');
      testData.track(`location ${name}`, () => ensureLocationDeleted(locationsPage, name));

      await locationsPage.openAddForm();
      const toastText = await locationsPage.createLocation(name);
      expect(toastText).toContain('Successfully Saved');

      await locationsPage.goto();
      const row = await locationsPage.findRow(name);
      await expect(row).toBeVisible();
    });

    test('TC_ADM_ORG_007 - mandatory validation, Name empty', async ({ page }) => {
      const locationsPage = new LocationsPage(page);
      await locationsPage.goto();
      await locationsPage.openAddForm();

      await locationsPage.submitEmptyName();

      await expect(locationsPage.fieldError('Name')).toHaveText('Required');
      await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);
    });
  });

  test('TC_ADM_ORG_019 - lazy-loaded child nodes expand on demand (Structure)', async ({ page }) => {
    const structurePage = new OrgStructurePage(page);
    await structurePage.goto();

    await expect(structurePage.childNode('Engineering', 'Development')).toHaveCount(0);
    await expect(structurePage.childNode('Engineering', 'Quality Assurance')).toHaveCount(0);
    await expect(structurePage.childNode('Engineering', 'TechOps')).toHaveCount(0);

    await structurePage.expand('Engineering');

    await expect(structurePage.childNode('Engineering', 'Development')).toBeVisible();
    await expect(structurePage.childNode('Engineering', 'Quality Assurance')).toBeVisible();
    await expect(structurePage.childNode('Engineering', 'TechOps')).toBeVisible();
  });
});
