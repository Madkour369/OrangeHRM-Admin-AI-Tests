import { test, expect } from '../../src/fixtures';
import { UserManagementPage } from '../../src/pages/admin/UserManagementPage';

const PASSWORD = 'Passw0rd!2025';

/** Idempotent: safe to call whether or not the user was already deleted by the test itself. */
async function ensureUserDeleted(userPage: UserManagementPage, username: string): Promise<void> {
  await userPage.goto();
  await userPage.searchByUsername(username);
  if ((await userPage.table.row(username).count()) === 0) return;
  await userPage.deleteByUsername(username);
}

/**
 * Navigates to whichever page of the UNFILTERED list currently shows `username`.
 *
 * Live-diagnosed 2026-09-24: the Username search filter is an EXACT match, not a
 * substring/contains match — confirmed directly (searching a true prefix of a real,
 * live username, e.g. "e2e_bulk_mufy5872" against the full existing
 * "e2e_bulk_mufy5872y9qy", still returned "No Records Found"). A single filter
 * therefore can't be used to narrow the list down to two DIFFERENT freshly-created
 * users at once for a bulk-select test. The unfiltered list sorts usernames
 * alphabetically (confirmed live), so two `e2e_<domain>_<...>` users created back to
 * back share a literal prefix and sort adjacent to each other — this walks the
 * unfiltered, paginated list to find whichever page contains the first one.
 */
async function goToPageContaining(userPage: UserManagementPage, username: string): Promise<void> {
  await userPage.goto();
  if ((await userPage.table.row(username).count()) > 0) return;

  const paginationVisible = await userPage.table.pagination.isVisible().catch(() => false);
  if (!paginationVisible) return;

  const pageButtons = userPage.table.pagination.getByRole('button');
  const buttonCount = await pageButtons.count();
  for (let i = 0; i < buttonCount; i++) {
    const label = ((await pageButtons.nth(i).textContent()) ?? '').trim();
    if (!/^\d+$/.test(label)) continue;
    const n = parseInt(label, 10);
    if (n === 1) continue;
    await userPage.table.goToPage(n);
    if ((await userPage.table.row(username).count()) > 0) return;
  }
}

/**
 * Aggregates every row across all pages for a search that may span more than one
 * page. Uses only the already-verified OxdTable.pagination/goToPage (exploration.md
 * §6) — falls through untouched when pagination isn't rendered (the common case for
 * a narrow filter like this one).
 */
async function collectAllUserRows(
  userPage: UserManagementPage,
): Promise<Array<{ username: string; role: string; status: string }>> {
  const rows = await userPage.allRowValues();
  const paginationVisible = await userPage.table.pagination.isVisible().catch(() => false);
  if (!paginationVisible) return rows;

  const pageButtons = userPage.table.pagination.getByRole('button');
  const buttonCount = await pageButtons.count();
  const pageNumbers: number[] = [];
  for (let i = 0; i < buttonCount; i++) {
    const label = ((await pageButtons.nth(i).textContent()) ?? '').trim();
    if (/^\d+$/.test(label)) pageNumbers.push(parseInt(label, 10));
  }

  const all = [...rows];
  for (const n of pageNumbers) {
    if (n === 1) continue;
    await userPage.table.goToPage(n);
    all.push(...(await userPage.allRowValues()));
  }
  return all;
}

test.describe('Admin > User Management > Users', () => {
  test('TC_ADM_USR_001 - add a valid ESS system user', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('user');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    const { toastText } = await userPage.createUser({
      userRole: 'ESS',
      employeeSearchText: 'a',
      status: 'Enabled',
      username,
      password: PASSWORD,
    });
    expect(toastText).toContain('Successfully Saved');

    await userPage.goto();
    await userPage.searchByUsername(username);
    await expect(userPage.table.row(username)).toBeVisible();
  });

  test('TC_ADM_USR_002 - username uniqueness is enforced', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('dup');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.createUser({
      userRole: 'ESS',
      employeeSearchText: 'a',
      status: 'Enabled',
      username,
      password: PASSWORD,
    });

    await userPage.openAddForm();
    await userPage.attemptDuplicateUsername({
      userRole: 'ESS',
      employeeSearchText: 'a',
      status: 'Enabled',
      username,
      password: PASSWORD,
    });

    await expect(userPage.fieldError('Username')).toHaveText('Already exists');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);

    await userPage.goto();
    await userPage.searchByUsername(username);
    await expect(userPage.table.rows.filter({ hasText: username })).toHaveCount(1);
  });

  test('TC_ADM_USR_003 - mandatory field blocks submission when User Role is empty', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('probe');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.submitAddFormWithEmptyField('User Role', username);

    await expect(userPage.fieldError('User Role')).toHaveText('Required');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);

    await userPage.goto();
    await userPage.searchByUsername(username);
    await expect(userPage.table.rows.filter({ hasText: username })).toHaveCount(0);
  });

  // Promoted from Wave 2 (test_design_coverage.md §8): a P0 case is now Wave 1 by
  // rule. TC_ADM_USR_005/006/007 are pure parameter variants of TC_ADM_USR_003 —
  // same page object, same submitAddFormWithEmptyField() helper (already typed to
  // accept 'Status' | 'Username' | 'Password', confirmed before writing this),
  // only the empty field differs. TC_ADM_USR_004 (Employee Name) stays Wave 2 —
  // it was not promoted to P0 (test_design_coverage.md §8.3: traceability, not
  // access), so it is out of scope for this batch.

  test('TC_ADM_USR_005 - mandatory field blocks submission when Status is empty', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('probe');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.submitAddFormWithEmptyField('Status', username);

    await expect(userPage.fieldError('Status')).toHaveText('Required');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);

    await userPage.goto();
    await userPage.searchByUsername(username);
    await expect(userPage.table.rows.filter({ hasText: username })).toHaveCount(0);
  });

  test('TC_ADM_USR_006 - mandatory field blocks submission when Username is empty', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('probe');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.submitAddFormWithEmptyField('Username', username);

    await expect(userPage.fieldError('Username')).toHaveText('Required');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);

    await userPage.goto();
    await userPage.searchByUsername(username);
    await expect(userPage.table.rows.filter({ hasText: username })).toHaveCount(0);
  });

  test('TC_ADM_USR_007 - mandatory field blocks submission when Password is empty', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('probe');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.submitAddFormWithEmptyField('Password', username);

    await expect(userPage.fieldError('Password')).toHaveText('Required');
    await expect(page.locator('.oxd-toast-content--success')).toHaveCount(0);

    await userPage.goto();
    await userPage.searchByUsername(username);
    await expect(userPage.table.rows.filter({ hasText: username })).toHaveCount(0);
  });

  test('TC_ADM_USR_009 - password policy feedback for a too-short password', async ({ page }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();
    await userPage.openAddForm();

    await userPage.enterPasswordOnly('abc');

    await expect(userPage.fieldError('Password')).toHaveText('Should have at least 7 characters');
  });

  test('TC_ADM_USR_013 - search filter Username = Admin returns a consistent result set', async ({ page }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    await userPage.searchByUsername('Admin');

    const expectedCount = await userPage.table.recordCount();
    const rows = await collectAllUserRows(userPage);
    expect(rows.length).toBe(expectedCount);
    for (const row of rows) {
      expect(row.username).toContain('Admin');
    }
  });

  test('TC_ADM_USR_018 - edit a system user\'s role', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('edit');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.createUser({
      userRole: 'ESS',
      employeeSearchText: 'a',
      status: 'Enabled',
      username,
      password: PASSWORD,
    });

    await userPage.goto();
    await userPage.searchByUsername(username);
    await userPage.openEditByUsername(username);
    const toastText = await userPage.changeUserRoleAndSave('Admin');
    // Live-observed 2026-09-24: the Edit User save toast reads "Successfully
    // Updated", not "Successfully Saved" — the CSV's Expected_Result (written from
    // the Add User flow's wording) doesn't hold for Edit. Asserting the verbatim
    // string actually produced by this flow, not the one recorded for a different
    // flow. See PROGRESS.md.
    expect(toastText).toContain('Successfully Updated');

    await userPage.goto();
    await userPage.searchByUsername(username);
    const rows = await userPage.allRowValues();
    const row = rows.find((r) => r.username === username);
    expect(row?.role).toBe('Admin');
  });

  test('TC_ADM_USR_020 - delete a single user with confirmation', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('del');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.createUser({
      userRole: 'ESS',
      employeeSearchText: 'a',
      status: 'Enabled',
      username,
      password: PASSWORD,
    });

    await userPage.goto();
    await userPage.searchByUsername(username);
    await userPage.openDeleteDialogByUsername(username);

    await expect(userPage.dialog.heading).toBeVisible();
    await expect(userPage.dialog.body).toBeVisible();
    await expect(userPage.dialog.cancelButton).toBeVisible();
    await expect(userPage.dialog.confirmButton).toBeVisible();

    const toastText = await userPage.toast.waitForSuccess(async () => {
      await userPage.dialog.confirm();
    });
    expect(toastText.length).toBeGreaterThan(0);

    await userPage.goto();
    await userPage.searchByUsername(username);
    await expect(userPage.table.rows.filter({ hasText: username })).toHaveCount(0);
  });

  test('TC_ADM_USR_022 - bulk delete via row checkboxes', async ({ page, testData }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const usernames = [testData.unique('bulk'), testData.unique('bulk')];
    for (const username of usernames) {
      testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));
      await userPage.openAddForm();
      await userPage.createUser({
        userRole: 'ESS',
        employeeSearchText: 'a',
        status: 'Enabled',
        username,
        password: PASSWORD,
      });
    }

    // Username search is exact-match only (live-diagnosed — see
    // goToPageContaining's comment), so a text filter can't show both new users at
    // once. Both share a literal prefix and the unfiltered list sorts
    // alphabetically, so they land on the same page; find it via the first one.
    await goToPageContaining(userPage, usernames[0]);
    for (const username of usernames) {
      await expect(userPage.table.row(username)).toBeVisible();
      await userPage.selectRowCheckbox(username);
    }
    await expect(userPage.recordsSelectedHeader).toHaveText('(2) Records Selected');

    await userPage.deleteSelectedButton.click();
    await expect(userPage.dialog.body).toBeVisible();

    const toastText = await userPage.toast.waitForSuccess(async () => {
      await userPage.dialog.confirm();
    });
    expect(toastText.length).toBeGreaterThan(0);

    // Assert on the two records this test actually created, not a global count —
    // the unfiltered total is shared with concurrent real users on this demo
    // (CLAUDE.md §5.3) and isn't a reliable before/after delta on its own.
    for (const username of usernames) {
      await userPage.goto();
      await userPage.searchByUsername(username);
      await expect(userPage.table.rows.filter({ hasText: username })).toHaveCount(0);
    }
  });

  test('TC_ADM_USR_024 - row action icons are ordered delete-then-edit (FIND-004 regression guard)', async ({
    page,
    testData,
  }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    const username = testData.unique('icons');
    testData.track(`user ${username}`, () => ensureUserDeleted(userPage, username));

    await userPage.openAddForm();
    await userPage.createUser({
      userRole: 'ESS',
      employeeSearchText: 'a',
      status: 'Enabled',
      username,
      password: PASSWORD,
    });

    await userPage.goto();
    await userPage.searchByUsername(username);
    const order = await userPage.firstRowActionIconOrder();
    expect(order).toEqual(['bi-trash', 'bi-pencil-fill']);
  });
});
