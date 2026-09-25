import { Page } from '@playwright/test';
import { test, expect } from '../../src/fixtures';
import { NationalitiesPage } from '../../src/pages/admin/NationalitiesPage';
import { dropdown, waitForIdle } from '../../src/utils/fieldFactory';

/** Idempotent: safe to call whether or not the record was already deleted by the test itself. */
async function ensureNationalityDeleted(natPage: NationalitiesPage, name: string): Promise<void> {
  await natPage.goto();
  const row = await natPage.findRow(name);
  if ((await row.count()) === 0) return;
  await natPage.deleteByName(name);
}

/**
 * Navigates to an employee's Personal Details. Live-diagnosed 2026-09-24: neither
 * `waitForIdle()` nor waiting for the Nationality dropdown trigger to become
 * visible is reliable here — a screenshot at the moment of failure showed the
 * form area still empty/spinning even after the trigger had briefly appeared and
 * disappeared (this route does a fast initial render before its real data
 * arrives, causing a flicker that a one-shot visibility check can catch too
 * early). Waiting for the specific `GET .../personal-details` API response
 * (confirmed live via the browser's own network log — the actual call this page
 * loads its form data from) is a precise, deterministic signal instead, armed
 * before the navigation so the response can't be missed.
 */
async function gotoPersonalDetails(page: Page, empNumber: number): Promise<void> {
  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/pim/employees/${empNumber}/personal-details`) && res.ok()),
    page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${empNumber}`),
  ]);
  await waitForIdle(page);
}

async function gotoEmployeeList(page: Page): Promise<void> {
  await page.goto('/web/index.php/pim/viewEmployeeList');
  await waitForIdle(page);
  // waitForIdle's spinner-gone check alone can resolve before the list has
  // actually rendered any rows (same race class documented on
  // OxdTable.waitForListRendered) — wait for a real row directly.
  await page.locator('.oxd-table-body .oxd-table-row').first().waitFor({ state: 'visible', timeout: 20_000 });
}

async function findEmployeeWithBlankNationality(page: Page, maxAttempts = 8): Promise<number> {
  await gotoEmployeeList(page);
  const rows = page.locator('.oxd-table-body .oxd-table-row');
  const count = Math.min(await rows.count(), maxAttempts);

  for (let i = 0; i < count; i++) {
    await gotoEmployeeList(page);
    // Armed before the click — see gotoPersonalDetails' comment for why this
    // specific response (not element visibility) is the reliable signal here.
    // The empNumber isn't known until after navigation, so this matches the
    // endpoint generically rather than a specific id.
    const [response] = await Promise.all([
      page.waitForResponse((res) => /\/pim\/employees\/\d+\/personal-details/.test(res.url()) && res.ok()),
      page.locator('.oxd-table-body .oxd-table-row').nth(i).locator('.oxd-table-cell').nth(2).click(),
    ]);
    const match = response.url().match(/employees\/(\d+)\/personal-details/);
    if (!match) continue;
    const empNumber = parseInt(match[1], 10);
    await waitForIdle(page);

    const nationalityText = (await dropdown(page, 'Nationality').selectedText()).trim();
    if (nationalityText === '-- Select --') return empNumber;
  }

  throw new Error(`No employee with a blank Nationality found in the first ${count} PIM employees.`);
}

test.describe('Admin > Nationalities', () => {
  test('TC_ADM_NAT_001 - create a Nationalities record', async ({ page, testData }) => {
    const natPage = new NationalitiesPage(page);
    await natPage.goto();

    const name = testData.unique('nat');
    testData.track(`nationality ${name}`, () => ensureNationalityDeleted(natPage, name));

    await natPage.openAddForm();
    const toastText = await natPage.createNationality(name);
    expect(toastText).toContain('Successfully Saved');

    await natPage.goto();
    const row = await natPage.findRow(name);
    await expect(row).toBeVisible();
  });

  test('TC_ADM_NAT_002 - mandatory validation, Name empty', async ({ page }) => {
    const natPage = new NationalitiesPage(page);
    await natPage.goto();
    await natPage.openAddForm();

    await natPage.submitEmptyName();

    await expect(natPage.fieldError('Name')).toHaveText('Required');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);
  });

  test('TC_ADM_NAT_003 - duplicate Name is rejected', async ({ page }) => {
    const natPage = new NationalitiesPage(page);
    await natPage.goto();
    await natPage.openAddForm();

    // "Afghan" is stable seed data (exploration.md §2.5 baseline, confirmed live) —
    // read-only use as a known-existing value, never mutated or depended on for
    // identity beyond "this name already exists".
    await natPage.nameField().fill('Afghan');
    await natPage.submitEmptyName();

    await expect(natPage.fieldError('Name')).toHaveText('Already exists');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);
  });

  test('TC_ADM_NAT_010 - deleting an in-use Nationality — KNOWN DEFECT BUG-001', async ({ page, testData }) => {
    const natPage = new NationalitiesPage(page);
    await natPage.goto();

    const name = testData.unique('nat');
    testData.track(`nationality ${name}`, () => ensureNationalityDeleted(natPage, name));

    await natPage.openAddForm();
    await natPage.createNationality(name);

    const empNumber = await findEmployeeWithBlankNationality(page);

    // Assign the owned Nationality to the employee and save. Waits for the
    // success toast (pre-armed before the click) rather than waitForIdle alone —
    // live-diagnosed: this form's spinner can be gone/never-shown well before the
    // save request actually persists, so a caller that immediately navigates away
    // (the reload below) can race ahead of the real save.
    await gotoPersonalDetails(page, empNumber);
    await dropdown(page, 'Nationality').select(name);
    const personalDetailsSaveButton = page
      .locator('.oxd-form')
      .filter({ has: page.locator('label', { hasText: /^Nationality$/ }) })
      .getByRole('button', { name: 'Save', exact: true });
    const successToast = page.locator('.oxd-toast-content--success');
    await Promise.all([successToast.waitFor({ state: 'visible' }), personalDetailsSaveButton.click()]);

    // Reload fresh (not optimistic UI state) and confirm the assignment persisted.
    await gotoPersonalDetails(page, empNumber);
    expect((await dropdown(page, 'Nationality').selectedText()).trim()).toBe(name);

    // Delete the in-use Nationality. Per CLAUDE.md's Locator Risk Register, the
    // confirm dialog is generically worded across every delete scenario and must
    // never be used to distinguish this one — only the outcome is asserted below.
    await natPage.goto();
    const deleteToastText = await natPage.deleteByName(name);
    expect(deleteToastText.length).toBeGreaterThan(0);

    // BUG-001, reproduced live 2026-09-24 (exploration.md §2.5/§5, reproduced
    // 2/2 there and again here): the delete succeeds with no warning, and the
    // referencing employee's Nationality is silently reset to blank. This is the
    // product's ACTUAL behaviour — asserting it directly (not test.fixme()) so
    // this test regression-guards the defect itself, per CLAUDE.md §6.4's "assert
    // the ACTUAL buggy behaviour, never the desired-but-absent one."
    await gotoPersonalDetails(page, empNumber);
    expect((await dropdown(page, 'Nationality').selectedText()).trim()).toBe('-- Select --');
  });

  test('TC_ADM_NAT_011 - pagination integrity across Nationalities pages', async ({ page }) => {
    const natPage = new NationalitiesPage(page);
    await natPage.goto();

    await expect(natPage.table.pagination).toBeVisible();

    const page1Names = await natPage.table.rows.evaluateAll((rows) =>
      rows.map((r) => r.querySelector('.oxd-table-cell:nth-child(2)')?.textContent?.trim() ?? ''),
    );

    await natPage.table.goToPage(2);
    const page2Names = await natPage.table.rows.evaluateAll((rows) =>
      rows.map((r) => r.querySelector('.oxd-table-cell:nth-child(2)')?.textContent?.trim() ?? ''),
    );

    // No-overlap/no-duplication property (BR-07) — never assert specific names,
    // per Constitution VI.1 and the CSV's own explicit instruction.
    const page1Set = new Set(page1Names);
    const overlap = page2Names.filter((n) => page1Set.has(n));
    expect(overlap).toEqual([]);

    const combined = [...page1Names, ...page2Names];
    expect(new Set(combined).size).toBe(combined.length);
  });
});
