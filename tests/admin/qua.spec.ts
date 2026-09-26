import { test, expect } from '../../src/fixtures';
import { SkillsPage } from '../../src/pages/admin/SkillsPage';

/** Idempotent: safe to call whether or not the record was already deleted by the test itself. */
async function ensureSkillDeleted(skillsPage: SkillsPage, name: string): Promise<void> {
  await skillsPage.goto();
  if ((await skillsPage.table.row(name).count()) === 0) return;
  await skillsPage.deleteByName(name);
}

test.describe('Admin > Qualifications > Skills', () => {
  test('TC_ADM_QUA_001 - create a Skills record', async ({ page, testData }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const name = testData.unique('skill');
    testData.track(`skill ${name}`, () => ensureSkillDeleted(skillsPage, name));

    await skillsPage.openAddForm();
    const toastText = await skillsPage.createSkill(name);
    expect(toastText).toContain('Successfully Saved');

    await skillsPage.goto();
    await expect(skillsPage.table.row(name)).toBeVisible();
  });

  test('TC_ADM_QUA_002 - mandatory validation, Name empty', async ({ page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();
    await skillsPage.openAddForm();

    await skillsPage.submitEmptyName();

    await expect(skillsPage.fieldError('Name')).toHaveText('Required');
    expect(await skillsPage.toast.successToastCount()).toBe(0);
  });

  test('TC_ADM_QUA_006 - edit an existing Skills record', async ({ page, testData }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const original = testData.unique('skill');
    const edited = `${original}_edited`;
    testData.track(`skill ${edited}`, () => ensureSkillDeleted(skillsPage, edited));
    testData.track(`skill ${original}`, () => ensureSkillDeleted(skillsPage, original));

    await skillsPage.openAddForm();
    await skillsPage.createSkill(original);

    await skillsPage.goto();
    await skillsPage.openEditByName(original);
    const toastText = await skillsPage.changeNameAndSave(edited);
    // Live-observed (M4 execution TC_ADM_QUA_006, consistent with USR_018 /
    // TC_ADM_JOB_006): the edit-save toast reads "Successfully Updated", distinct
    // from the Add flow's "Successfully Saved".
    expect(toastText).toContain('Successfully Updated');

    await skillsPage.goto();
    await expect(skillsPage.table.row(edited)).toBeVisible();
  });

  test('TC_ADM_QUA_007 - Cancel discards changes on Skills', async ({ page, testData }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const name = testData.unique('cancel');
    testData.track(`skill ${name}`, () => ensureSkillDeleted(skillsPage, name));

    await skillsPage.openAddForm();
    await skillsPage.cancelAdd(name);

    await expect(page).toHaveURL(/viewSkills/);
    await expect(skillsPage.table.row(name)).toHaveCount(0);
  });

  test('TC_ADM_QUA_008 - delete a Skills record with confirmation', async ({ page, testData }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const name = testData.unique('del');
    testData.track(`skill ${name}`, () => ensureSkillDeleted(skillsPage, name));

    await skillsPage.openAddForm();
    await skillsPage.createSkill(name);

    await skillsPage.goto();
    const beforeCount = await skillsPage.table.recordCount();
    await skillsPage.openDeleteDialogByName(name);

    await expect(skillsPage.dialog.heading).toBeVisible();
    await expect(skillsPage.dialog.body).toBeVisible();
    await expect(skillsPage.dialog.cancelButton).toBeVisible();
    await expect(skillsPage.dialog.confirmButton).toBeVisible();

    const toastText = await skillsPage.toast.waitForSuccess(async () => {
      await skillsPage.dialog.confirm();
    });
    // Verbatim, observed live in M5 on 2026-09-26 (exploration.md Addendum A).
    expect(toastText).toBe('Successfully Deleted');

    await skillsPage.goto();
    await expect(skillsPage.table.row(name)).toHaveCount(0);
    const afterCount = await skillsPage.table.recordCount();
    expect(afterCount).toBe(beforeCount - 1);
  });

  test('TC_ADM_QUA_009 - cancelling delete preserves the Skills record', async ({ page, testData }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const name = testData.unique('delcancel');
    testData.track(`skill ${name}`, () => ensureSkillDeleted(skillsPage, name));

    await skillsPage.openAddForm();
    await skillsPage.createSkill(name);

    await skillsPage.goto();
    await skillsPage.openDeleteDialogByName(name);
    await expect(skillsPage.dialog.heading).toBeVisible();

    await skillsPage.dialog.cancel();

    await expect(skillsPage.dialog.heading).toHaveCount(0);
    await expect(skillsPage.table.row(name)).toBeVisible();
  });

  test('TC_ADM_QUA_010 - long Description is retained in full on edit', async ({ page, testData }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const name = testData.unique('longdesc');
    const description = 'd'.repeat(398);
    testData.track(`skill ${name}`, () => ensureSkillDeleted(skillsPage, name));

    await skillsPage.openAddForm();
    const toastText = await skillsPage.createSkill(name, description);
    expect(toastText).toContain('Successfully Saved');

    await skillsPage.goto();
    await skillsPage.openEditByName(name);
    const reopenedValue = await skillsPage.descriptionField().inputValue();
    expect(reopenedValue).toHaveLength(398);
    expect(reopenedValue).toBe(description);
  });
});
