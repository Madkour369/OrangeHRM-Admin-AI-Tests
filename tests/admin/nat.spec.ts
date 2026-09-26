import { test, expect } from '../../src/fixtures';
import { NationalitiesPage } from '../../src/pages/admin/NationalitiesPage';
import { EmployeeListPage } from '../../src/pages/pim/EmployeeListPage';
import { PersonalDetailsPage } from '../../src/pages/pim/PersonalDetailsPage';

/** Idempotent: safe to call whether or not the record was already deleted by the test itself. */
async function ensureNationalityDeleted(natPage: NationalitiesPage, name: string): Promise<void> {
  await natPage.goto();
  const row = await natPage.findRow(name);
  if ((await row.count()) === 0) return;
  await natPage.deleteByName(name);
}

/**
 * Visits PIM employees in turn until one has a blank Nationality. Page-object calls
 * only (2026-09-26 review): the raw oxd- table selectors, `.first()` and positional
 * `.nth(2)` column click that used to live here moved into EmployeeListPage and
 * PersonalDetailsPage.
 */
async function findEmployeeWithBlankNationality(
  employeeList: EmployeeListPage,
  personalDetails: PersonalDetailsPage,
  maxAttempts = 8,
): Promise<number> {
  await employeeList.goto();
  const count = Math.min(await employeeList.rowCount(), maxAttempts);

  for (let i = 0; i < count; i++) {
    await employeeList.goto();
    const empNumber = await employeeList.openEmployeeAt(i);
    if (empNumber === null) continue;
    if ((await personalDetails.selectedNationality()) === '-- Select --') return empNumber;
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
    expect(await natPage.toast.successToastCount()).toBe(0);
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
    expect(await natPage.toast.successToastCount()).toBe(0);
  });

  test('TC_ADM_NAT_010 - deleting an in-use Nationality — KNOWN DEFECT BUG-001', async ({ page, testData }) => {
    const natPage = new NationalitiesPage(page);
    await natPage.goto();

    const name = testData.unique('nat');
    testData.track(`nationality ${name}`, () => ensureNationalityDeleted(natPage, name));

    await natPage.openAddForm();
    await natPage.createNationality(name);

    const employeeList = new EmployeeListPage(page);
    const personalDetails = new PersonalDetailsPage(page);
    const empNumber = await findEmployeeWithBlankNationality(employeeList, personalDetails);

    // Assign the owned Nationality to the employee and save. saveNationality() waits
    // for the success toast, armed before the click, so the reload below cannot race
    // the save (see PersonalDetailsPage.saveNationality).
    await personalDetails.goto(empNumber);
    await personalDetails.saveNationality(name);

    // Reload fresh (not optimistic UI state) and confirm the assignment persisted.
    await personalDetails.goto(empNumber);
    expect(await personalDetails.selectedNationality()).toBe(name);

    // Delete the in-use Nationality. Per CLAUDE.md's Locator Risk Register, the
    // confirm dialog is generically worded across every delete scenario and must
    // never be used to distinguish this one — only the outcome is asserted below.
    await natPage.goto();
    const deleteToastText = await natPage.deleteByName(name);
    // Verbatim, observed live in M5 on 2026-09-26 (exploration.md Addendum A).
    expect(deleteToastText).toBe('Successfully Deleted');

    // BUG-001, reproduced live 2026-09-24 (exploration.md §2.5/§5, reproduced
    // 2/2 there and again here): the delete succeeds with no warning, and the
    // referencing employee's Nationality is silently reset to blank. This is the
    // product's ACTUAL behaviour — asserting it directly (not test.fixme()) so
    // this test regression-guards the defect itself, per CLAUDE.md §6.4's "assert
    // the ACTUAL buggy behaviour, never the desired-but-absent one."
    await personalDetails.goto(empNumber);
    expect(await personalDetails.selectedNationality()).toBe('-- Select --');
  });

  test('TC_ADM_NAT_011 - pagination integrity across Nationalities pages', async ({ page }) => {
    const natPage = new NationalitiesPage(page);
    await natPage.goto();

    await expect(natPage.table.pagination).toBeVisible();

    const page1Names = await natPage.table.columnTexts('Nationality');

    await natPage.table.goToPage(2);
    const page2Names = await natPage.table.columnTexts('Nationality');

    // No-overlap/no-duplication property (BR-07) — never assert specific names,
    // per Constitution VI.1 and the CSV's own explicit instruction.
    const page1Set = new Set(page1Names);
    const overlap = page2Names.filter((n) => page1Set.has(n));
    expect(overlap).toEqual([]);

    const combined = [...page1Names, ...page2Names];
    expect(new Set(combined).size).toBe(combined.length);
  });
});
