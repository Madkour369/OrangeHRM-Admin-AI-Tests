import { test, expect } from '../../src/fixtures';
import { JobTitlesPage } from '../../src/pages/admin/JobTitlesPage';
import { PayGradesPage } from '../../src/pages/admin/PayGradesPage';
import { WorkShiftsPage } from '../../src/pages/admin/WorkShiftsPage';

/** Idempotent: safe to call whether or not the record was already deleted by the test itself. */
async function ensureJobTitleDeleted(jobPage: JobTitlesPage, jobTitle: string): Promise<void> {
  await jobPage.goto();
  if ((await jobPage.table.row(jobTitle).count()) === 0) return;
  await jobPage.deleteByTitle(jobTitle);
}

async function ensurePayGradeDeleted(payGradesPage: PayGradesPage, name: string): Promise<void> {
  await payGradesPage.goto();
  const row = await payGradesPage.findRow(name);
  if ((await row.count()) === 0) return;
  await payGradesPage.deleteByName(name);
}

async function ensureWorkShiftDeleted(workShiftsPage: WorkShiftsPage, name: string): Promise<void> {
  await workShiftsPage.goto();
  const row = await workShiftsPage.findRow(name);
  if ((await row.count()) === 0) return;
  await workShiftsPage.deleteByName(name);
}

test.describe('Admin > Job > Job Titles', () => {
  test('TC_ADM_JOB_001 - create a Job Titles record', async ({ page, testData }) => {
    const jobPage = new JobTitlesPage(page);
    await jobPage.goto();

    const jobTitle = testData.unique('jobtitle');
    testData.track(`job title ${jobTitle}`, () => ensureJobTitleDeleted(jobPage, jobTitle));

    await jobPage.openAddForm();
    const toastText = await jobPage.createJobTitle(jobTitle);
    expect(toastText).toContain('Successfully Saved');

    await jobPage.goto();
    await expect(jobPage.table.row(jobTitle)).toBeVisible();
  });

  test('TC_ADM_JOB_002 - mandatory validation, Job Title empty', async ({ page }) => {
    const jobPage = new JobTitlesPage(page);
    await jobPage.goto();
    await jobPage.openAddForm();

    await jobPage.submitEmptyJobTitle();

    await expect(jobPage.fieldError('Job Title')).toHaveText('Required');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);
  });

  test('TC_ADM_JOB_006 - edit an existing Job Titles record', async ({ page, testData }) => {
    const jobPage = new JobTitlesPage(page);
    await jobPage.goto();

    const original = testData.unique('jobtitle');
    const edited = `${original}_edited`;
    testData.track(`job title ${edited}`, () => ensureJobTitleDeleted(jobPage, edited));
    testData.track(`job title ${original}`, () => ensureJobTitleDeleted(jobPage, original));

    await jobPage.openAddForm();
    await jobPage.createJobTitle(original);

    await jobPage.goto();
    await jobPage.openEditByTitle(original);
    const toastText = await jobPage.changeJobTitleAndSave(edited);
    // Live-observed 2026-09-24 (M4 execution, TC_ADM_JOB_006; consistent with
    // USR_018): the edit-save toast reads "Successfully Updated", distinct from
    // the Add flow's "Successfully Saved". Asserting the verbatim string this flow
    // actually produces.
    expect(toastText).toContain('Successfully Updated');

    await jobPage.goto();
    await expect(jobPage.table.row(edited)).toBeVisible();
  });

  test('TC_ADM_JOB_007 - Cancel discards changes on Job Titles', async ({ page, testData }) => {
    const jobPage = new JobTitlesPage(page);
    await jobPage.goto();

    const jobTitle = testData.unique('cancel');
    testData.track(`job title ${jobTitle}`, () => ensureJobTitleDeleted(jobPage, jobTitle));

    await jobPage.openAddForm();
    await jobPage.cancelAdd(jobTitle);

    await expect(page).toHaveURL(/viewJobTitleList/);
    await expect(jobPage.table.row(jobTitle)).toHaveCount(0);
  });

  test('TC_ADM_JOB_008 - delete a Job Titles record with confirmation', async ({ page, testData }) => {
    const jobPage = new JobTitlesPage(page);
    await jobPage.goto();

    const jobTitle = testData.unique('del');
    testData.track(`job title ${jobTitle}`, () => ensureJobTitleDeleted(jobPage, jobTitle));

    await jobPage.openAddForm();
    await jobPage.createJobTitle(jobTitle);

    await jobPage.goto();
    const beforeCount = await jobPage.table.recordCount();
    await jobPage.openDeleteDialogByTitle(jobTitle);

    await expect(jobPage.dialog.heading).toBeVisible();
    await expect(jobPage.dialog.body).toBeVisible();
    await expect(jobPage.dialog.cancelButton).toBeVisible();
    await expect(jobPage.dialog.confirmButton).toBeVisible();

    const toastText = await jobPage.toast.waitForSuccess(async () => {
      await jobPage.dialog.confirm();
    });
    expect(toastText.length).toBeGreaterThan(0);

    await jobPage.goto();
    await expect(jobPage.table.row(jobTitle)).toHaveCount(0);
    const afterCount = await jobPage.table.recordCount();
    expect(afterCount).toBe(beforeCount - 1);
  });

  test('TC_ADM_JOB_009 - cancelling delete preserves the Job Titles record', async ({ page, testData }) => {
    const jobPage = new JobTitlesPage(page);
    await jobPage.goto();

    const jobTitle = testData.unique('delcancel');
    testData.track(`job title ${jobTitle}`, () => ensureJobTitleDeleted(jobPage, jobTitle));

    await jobPage.openAddForm();
    await jobPage.createJobTitle(jobTitle);

    await jobPage.goto();
    await jobPage.openDeleteDialogByTitle(jobTitle);
    await expect(jobPage.dialog.heading).toBeVisible();

    await jobPage.dialog.cancel();

    await expect(jobPage.dialog.heading).toHaveCount(0);
    await expect(jobPage.table.row(jobTitle)).toBeVisible();
  });
});

test.describe('Admin > Job > Pay Grades', () => {
  test('TC_ADM_JOB_023 - Currency Minimum Salary must not exceed Maximum Salary', async ({ page, testData }) => {
    const payGradesPage = new PayGradesPage(page);
    await payGradesPage.goto();

    const name = testData.unique('paygrade');
    testData.track(`pay grade ${name}`, () => ensurePayGradeDeleted(payGradesPage, name));

    await payGradesPage.openAddForm();
    await payGradesPage.createPayGrade(name);

    await payGradesPage.openAddCurrencyForm();
    await payGradesPage.selectCurrency('EUR - Euro');
    await payGradesPage.minimumSalaryField().fill('60000');
    await payGradesPage.maximumSalaryField().fill('50000');
    await payGradesPage.saveCurrency();

    await expect(payGradesPage.fieldError('Minimum Salary')).toHaveText('Should be lower than Maximum Salary');
    await expect(payGradesPage.fieldError('Maximum Salary')).toHaveText('Should be higher than Minimum Salary');
  });
});

test.describe('Admin > Job > Work Shifts', () => {
  test('TC_ADM_JOB_049 - overnight Work Shift time ordering is rejected', async ({ page, testData }) => {
    const workShiftsPage = new WorkShiftsPage(page);
    await workShiftsPage.goto();

    const name = testData.unique('overnight');
    testData.track(`work shift ${name}`, () => ensureWorkShiftDeleted(workShiftsPage, name));

    await workShiftsPage.openAddForm();
    await workShiftsPage.shiftNameField().fill(name);
    await workShiftsPage.fromTimePicker.setTime('06', '00', 'PM', workShiftsPage.shiftNameField());
    await workShiftsPage.toTimePicker.setTime('09', '00', 'AM', workShiftsPage.shiftNameField());

    await expect(workShiftsPage.fieldError('To')).toHaveText('To time should be after from time');
    await expect(workShiftsPage.durationPerDayText).toHaveText('0.00');

    await workShiftsPage.attemptSave();

    // Save is blocked client-side — still on the Add form, no record created.
    await expect(page).toHaveURL(/saveWorkShifts/);
    await workShiftsPage.goto();
    const row = await workShiftsPage.findRow(name);
    await expect(row).toHaveCount(0);
  });
});
