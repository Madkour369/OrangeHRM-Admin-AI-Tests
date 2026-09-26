# Code Standards — OrangeHRM Admin UI Automation

This is the coding style the Playwright + TypeScript suite in `src/` and `tests/` actually follows, written from the code as it stands (2026-09-26), not from intentions. Every excerpt is copied from the repository. Where the code departs from a rule, the departure is documented in a **Deviation** note and collected in the table at the end. The governing rules come from `CLAUDE.md` §4–§5 and `.specify/memory/constitution.md` Article IV; `/code-review` (`.claude/commands/code-review.md`) is the checklist that enforces them.

## 1. Layers and the dependency rule

```
tests/<module>/*.spec.ts        assertions live here, and only here
   └─> src/fixtures/            auth (real UI login), page (lands on a stable screen), data (e2e_ records + teardown)
         └─> src/pages/         page objects: behaviour methods, no assertions
               ├─> base/        BasePage, LoginPage (module-agnostic)
               ├─> admin/       one class per Admin screen
               └─> pim/         the two PIM screens an Admin test needs
                     └─> src/components/   one wrapper per oxd primitive (dropdown, table, toast, dialog, ...)
                           └─> src/utils/fieldFactory.ts   label-anchored lookups, waitForIdle, uniqueValue
```

Imports point downward only. Tests import from one place, `src/fixtures/index.ts`:

```ts
/** Single import point for tests: `import { test, expect } from '../../src/fixtures';` */
export { test } from './data.fixture';
export { expect } from '@playwright/test';
```

No component, util or fixture imports a page object, with one downward-consistent exception: `auth.fixture.ts` imports `LoginPage` to perform the real UI login.

**Module-agnostic rule.** Nothing in `src/components`, `src/fixtures`, `src/utils` or `src/pages/base` names a module or screen (a grep for "Admin" in those folders returns nothing functional). The login credential lives in `playwright.config.ts` as configuration, not in framework code:

```ts
process.env.ORANGEHRM_USER ??= 'Admin';
process.env.ORANGEHRM_PASSWORD ??= 'admin123';
```

A new module needs only `src/pages/<module>/` and `tests/<module>/`. Anything else it seems to need below `src/pages/` is treated as a framework gap and solved generically.

## 2. Page Object Model rules

- **Behaviour methods, not scripts.** A page object exposes what a user does on the screen (`createSkill`, `deleteByName`, `openEditByName`) and returns values for the test to assert (for example the toast message). It never decides whether a result is right.
- **Zero assertions.** No page object calls `expect` (grep of `src/pages/` returns nothing).
- **Components as readonly fields; locators as lazy getters.** Nothing is resolved in a constructor, so a locator is evaluated at the moment it is used, against the current DOM.

From `src/pages/admin/SkillsPage.ts`:

```ts
export class SkillsPage extends BasePage {
  readonly table: OxdTable;
  readonly toast: OxdToast;

  constructor(page: Page) {
    super(page);
    this.table = new OxdTable(page);
    this.toast = new OxdToast(page);
  }

  async goto(): Promise<void> {
    await this.gotoPath('/web/index.php/admin/viewSkills');
    await this.table.waitForListRendered();
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  /** Fills Name (and saves). Returns the toast text — caller asserts the verbatim wording. */
  async createSkill(name: string, description?: string): Promise<string> {
    await this.nameField().fill(name);
    if (description !== undefined) await this.descriptionField().fill(description);
    return this.toast.waitForSuccess(async () => {
      await this.saveButton.click();
```

Navigation goes through `BasePage.gotoPath()`, which waits for the sidebar and for the spinner to clear:

```ts
protected async gotoPath(path: string): Promise<void> {
  await this.page.goto(path);
  await this.sidebar.waitFor({ state: 'visible' });
  await waitForIdle(this.page);
}
```

> **Deviation — page objects also expose locators to tests.** `/code-review`'s rule is "page objects expose behaviour, not raw locators, to tests". In practice tests assert against locator getters that page objects expose, for example `skillsPage.fieldError('Name')`, `userPage.table.rows` and `userPage.dialog.heading`. The locators are still built inside the page object and its components (tests never write selectors for them), but the rule as written is not met.

## 3. Locator strategy

In priority order, as the code uses it:

1. **Role and accessible name** — `getByRole('button', { name: 'Save', exact: true })`. Exact names by default.
2. **Label-anchored field lookup** — anchored on the `<label>` element itself, then the input inside the same `.oxd-input-group`. This is the corrected form of `CLAUDE.md` §5.1's example: filtering the group by its full text fails when a sibling control renders text, such as a dropdown's "-- Select --" (HEAL-005).

   From `src/utils/fieldFactory.ts`:
   ```ts
   export function labelledContainer(scope: Page | Locator, label: string): Locator {
     const labelText = new RegExp('^' + escapeRegExp(label) + '$');
     return scope
       .locator('.oxd-input-group')
       .filter({ has: scope.locator('label', { hasText: labelText }) })
       .first();
   }
   ```
3. **Scoped `oxd-` CSS, inside components only**, always chained from a container.
4. **Rows by exact cell text**, never by position. From `src/components/OxdTable.ts`:
   ```ts
   row(cellText: string): Locator {
     return this.rows.filter({ has: this.page.locator('.oxd-table-cell').getByText(cellText, { exact: true }) });
   }
   ```
   Columns are resolved from the header text (`OxdTable.cell(row, header)`, `columnTexts(header)`), so no caller hard-codes a column index.

**Banned, and why:**

| Banned | Why |
|---|---|
| XPath (positional or absolute) | Breaks on any layout change; `CLAUDE.md` §5.1 makes it an automatic rejection |
| `.nth()` / `nth-child` on business data | Row order changes on a shared demo; position is not identity |
| `.first()` to silence a strict-mode violation | Hides ambiguity; a substring match plus `.first()` let a check pass against the wrong row (fixed 2026-09-26, `code_review.md` R6) |
| `hasText` substring matching on row values | `e2e_x` also matches `e2e_x_edited` |
| Generated or hashed ids | Change between builds |
| Raw `oxd-` selectors outside `src/components/` and `fieldFactory.ts` | One place to fix when the component library changes |

Icon buttons need care: an icon can add a leading character to the computed accessible name (" Add", " Yes, Delete"), so those are matched without assuming a clean name (`exploration.md` §6, M5 locator corrections).

> **Deviations — `.first()` still used after exact matching.** `labelledContainer` and `formContaining` (`fieldFactory.ts`), `OxdCheckbox` and four `OxdTree` lookups call `.first()` after an exact-label filter; `OxdAutocomplete.selectFirstSuggestion()` deliberately picks the first hint; `OxdTable.waitForListRendered()` and `UserManagementPage` read `rows.first()` where "the first row" is the intent. None is known to resolve a real ambiguity today; they are listed as open Minors R9–R10 in `code_review.md`.
>
> **Deviation — raw locators in one test file.** `tests/admin/nav.spec.ts` builds three locators directly (`page.getByRole('banner')…`, lines 34, 80, 115); line 115 also uses `.first()` as a readiness wait. Open Minor R11.

## 4. The component wrapper pattern

Every oxd primitive gets one class in `src/components/` that owns its selectors and its traps. Page objects compose them; tests never see an `oxd-` class name. `fieldFactory` hands each component a label-scoped container.

`src/components/OxdDropdown.ts` in full (the `.oxd-select-text` trap: it is not a native `<select>`, so `selectOption()` throws):

```ts
export class OxdDropdown {
  private readonly page: Page;
  readonly trigger: Locator;

  constructor(private readonly container: Locator) {
    this.page = container.page();
    this.trigger = container.locator('.oxd-select-text');
  }

  async select(optionText: string): Promise<void> {
    await this.trigger.click();
    const listbox = this.page.locator('.oxd-select-dropdown');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: optionText, exact: true }).click();
    await expect(this.trigger).toHaveText(optionText);
  }

  /** Current selected text, for assertions or pre-condition checks. */
  async selectedText(): Promise<string> {
    return (await this.trigger.textContent())?.trim() ?? '';
  }
}
```

The same shape holds for `OxdTable`, `OxdToast`, `OxdDialog`, `OxdAutocomplete`, `OxdCheckbox`/`OxdRadioGroup`, `OxdDatePicker`, `OxdTimePicker`, `OxdFileUpload` and `OxdTree`. Each class comment records what was observed live on build 5.9 and where that differed from `CLAUDE.md` §5.2's prediction.

## 5. Wait strategy

**Mandated:**

- **Element-state and content waits**, never time. `waitForIdle()` waits for the spinner count to reach zero, and is called before interacting:
  ```ts
  export async function waitForIdle(page: Page, timeoutMs = 20_000): Promise<void> {
    await expect(page.locator('.oxd-loading-spinner')).toHaveCount(0, { timeout: timeoutMs });
  }
  ```
- **Content-based list readiness.** A spinner can be gone before the list has data, so `OxdTable.waitForListRendered()` waits for the record-count header or the empty state, then polls until the first row's cells hold text, re-checking the empty state on every attempt (HEAL-023 to HEAL-026).
- **Toasts are waited for before the click that triggers them**, because they auto-dismiss in about 3–5 s. From `src/components/OxdToast.ts`:
  ```ts
  async waitForSuccess(action: () => Promise<void>): Promise<string> {
    const toast = this.variantLocator('success');
    await Promise.all([toast.waitFor({ state: 'visible' }), action()]);
    return this.messageText(toast);
  }
  ```
- **Absence of a toast is checked once, not retried.** `expect(locator).toHaveCount(0)` would retry for 10 s and pass after a toast that did appear had faded, so tests read `successToastCount()` once, after the field error is visible:
  ```ts
  expect(await skillsPage.toast.successToastCount()).toBe(0);
  ```
- **Presence checks are count-based and cannot throw** (`OxdTable.isEmpty()`, `hasPagination()`), never `isVisible().catch(() => false)`.

**Banned:** `waitForTimeout` and any sleep; `networkidle` (this SPA polls, so it never settles reliably); widening a timeout without naming the readiness signal; `force: true` to click through an overlay; in-test retry loops.

> **Deviation — `expect` inside components and utils.** Components and `fieldFactory` use `expect(...)` as their waiting mechanism (`OxdDropdown`, `OxdAutocomplete`, `OxdDialog`, `OxdTable`, `OxdTimePicker`, `OxdToast`, `waitForIdle`, and the page fixture's sidebar check). These are waits, not test verdicts, and page objects stay assertion-free, but "assertions only in tests" is not literally true of the lower layers.
>
> **Deviation — network waits in two page objects.** `src/pages/pim/EmployeeListPage.ts` and `PersonalDetailsPage.ts` wait on the `GET …/personal-details` response (`page.waitForResponse`), armed before navigation, because the form renders before its data arrives. This observes the network; it never stubs it, so the UI-only rule holds.
>
> **Deviation — one forced click.** `OxdTimePicker` clicks its AM/PM radio input with `force: true`. The code comment documents why: on this component the input intercepts its own label, the reverse of every other radio on the site. It is not used to punch through an overlay.

## 6. Test structure and naming

- One `test.describe` per screen, named by its navigation path (`'Admin > Qualifications > Skills'`).
- **One test per test case, titled with its `Automation_ID`**, which equals the `TC_ID` in `test_design.csv`: `'TC_ADM_QUA_001 - create a Skills record'`. A set difference between the Wave 1 `Automation_ID`s and the ids in test titles must be empty in both directions; it is re-run at every gate.
- Known-defect tests carry the bug in their title: `'… — KNOWN DEFECT BUG-003'`.
- Assertions use the verbatim strings observed in the product and recorded in `exploration.md` or the CSV (`'Required'`, `'Successfully Deleted'`), never paraphrases, and never "the text is not empty".

From `tests/admin/qua.spec.ts`:

```ts
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
```

> **Deviation — toast assertions are not uniform.** The 5 delete tests assert the exact message (`toBe('Successfully Deleted')`); the 9 create and edit tests still use `toContain('Successfully Saved' | 'Successfully Updated')`. Both pass against the verbatim message, but exact matching is the standard.

## 7. Data isolation and teardown on a shared environment

The demo is public and other people change it while tests run, so:

- **Every record a test creates is unique and prefixed `e2e_`**, and bulk clean-up keys on that prefix:
  ```ts
  export function uniqueValue(domain: string): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 6);
    return `e2e_${domain}_${ts}${rand}`;
  }
  ```
- **Teardown is registered when the record is created and runs even if the test fails**, in reverse order. Failures are collected and rethrown together, so no clean-up error is swallowed. From `src/fixtures/data.fixture.ts`:
  ```ts
  async teardownAll(): Promise<void> {
    const errors: string[] = [];
    for (let i = this.cleanups.length - 1; i >= 0; i--) {
      const { label, fn } = this.cleanups[i];
      try {
        await fn();
      } catch (err) {
        errors.push(`Cleanup failed for "${label}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    this.cleanups.length = 0;
    if (errors.length) {
      throw new Error(`One or more test-data cleanups failed:\n${errors.join('\n')}`);
    }
  }
  ```
- Clean-up helpers are idempotent (`ensureSkillDeleted` returns early if the record is already gone), and tests only ever delete records they created.
- Tests assert on the records they created, never on shared totals.
- Configuration screens with global blast radius (Modules, LDAP, Branding publish, Send Test Mail) are never mutated by the suite.

> **Deviation — some tests read seed data.** `CLAUDE.md` §5.3 says "zero dependency on seeded records". Nine test lines read existing data without changing it: `TC_ADM_NAT_003` uses the existing nationality "Afghan" as a known duplicate, `TC_ADM_USR_013` searches for the "Admin" account, and user creation picks the first employee the Employee Name autocomplete offers for "a". All are read-only, but a demo reset that removed them would break those tests.

## 8. Authentication and session

- **One real UI login per worker**, through the login form, saved as storage state and reused by every test in that worker, as `CLAUDE.md` §2 permits after a real login.
- Credentials come only from `process.env`; the fixture fails loudly if they are unset.

> **Deviation — re-authentication is not wired in.** `CLAUDE.md` §5.3 requires the auth fixture to "detect a redirect to `/auth/login` and re-authenticate once before failing". `auth.fixture.ts` exports `reauthenticateIfExpired(page)` for this, but no fixture, page object or test calls it (grep finds only its export lines). A mid-run session expiry would currently fail the test instead of recovering.

## 9. Configuration

`playwright.config.ts`: Chromium only (the only browser ever observed in M2 and M4), `retries: 1` locally and `2` in CI, test timeout 90 s, expect 10 s, action 15 s, navigation 30 s, trace on first retry, video and screenshot on failure, no `networkidle` anywhere.

> **Deviation — the config allows parallelism the project does not use.** The config sets `workers: 2` and `fullyParallel: true` (the constitution's cap). Every official run since M4 overrides this with `--workers=1`, because execution is strictly sequential on one browser. The config does not encode that rule.

## 10. TypeScript conventions

- `strict: true` (`tsconfig.json`); `npx tsc --noEmit` must report 0 errors.
- No `any`, no `as any`, no non-null `!` on locator results (each grep returns nothing).
- No `console.*` anywhere in `src/` or `tests/`.
- Classes in PascalCase (`OxdTable`, `SkillsPage`), methods in camelCase named for the user action (`openEditByName`, `changeNameAndSave`), `readonly` for injected components, `async`/`await` throughout, and explicit return types on public methods.
- JSDoc comments explain *why*, including where a behaviour was "live-diagnosed" and which healing entry it came from, so a later reader does not mistake a deliberate decision for a shortcut.

> **Deviation — no logger.** `CLAUDE.md` §4 lists a logger under `src/utils/`, and `/code-review` checks "logger used". No logger module exists. Nothing logs, so nothing violates the "no console.log" rule, but the prescribed logger was never built.

## 11. Known product defects are asserted, not healed

A deterministic, confirmed product defect is asserted as the product's **actual** behaviour, with the bug id in the test title and in the CSV's `Linked_Bug`. The test passes while the bug exists and fails the day it is fixed, which forces a review. Healing is never applied to a product bug.

From `tests/admin/brd.spec.ts`:

```ts
test('TC_ADM_BRD_001 - upload of an unsupported file type — KNOWN DEFECT BUG-002', async ({ page }) => {
  const brdPage = new CorporateBrandingPage(page);
  await brdPage.goto();

  await brdPage.clientLogoUpload().upload(path.join(FIXTURES_DIR, 'e2e_wrongtype.txt'));

  await expect(brdPage.clientLogoFilenameText()).toContainText('e2e_wrongtype.txt');
  await expect(brdPage.clientLogoError()).toHaveCount(0);
});
```

The three known-defect guards are `TC_ADM_NAT_010` (BUG-001), `TC_ADM_BRD_001` (BUG-002) and `TC_ADM_NAV_004` (BUG-003).

> **Deviation — the written rule says `test.fixme()`.** `CLAUDE.md` §5.4 says a test that must pass against a broken feature should be `test.fixme()`'d with the bug id. The project deliberately asserts the actual behaviour instead, a practice that comes from the M4 brief (`prompts_used.md` #29, Rule 3). The comments in `brd.spec.ts`, `nat.spec.ts` and `nav.spec.ts` justify it by citing "CLAUDE.md §6.4", a section that does not exist. The practice is consistent; its written basis is not (`challenges_and_resolutions.xlsx`, CH-37).

## 12. Deviations at a glance

| # | Rule | Where the code departs | Status |
|---|---|---|---|
| 1 | Page objects expose behaviour, not locators | Tests assert on locator getters (`fieldError`, `table.rows`, `dialog.heading`) | Accepted in practice; rule not met as written |
| 2 | No `.first()` to silence strict mode | `.first()` after exact filters in `fieldFactory`, `OxdCheckbox`, `OxdTree`; deliberate first-item picks in `OxdAutocomplete`, `OxdTable`, `UserManagementPage` | Open Minors R9–R10 (`code_review.md`) |
| 3 | No raw locators in tests | `nav.spec.ts` lines 34, 80, 115 | Open Minor R11 |
| 4 | Assertions only in tests | `expect` used as a wait in components, utils and the page fixture | Accepted; page objects have none |
| 5 | UI only | `waitForResponse` in the two PIM page objects | Observation only, no stubbing |
| 6 | No `force: true` | `OxdTimePicker` AM/PM radio | Documented in code |
| 7 | Exact verbatim assertions | Create/edit toasts use `toContain` (9 lines) | Open |
| 8 | Zero dependency on seeded records | 9 read-only uses ("Afghan", "Admin", first employee suggestion) | Open |
| 9 | Re-authenticate once on redirect to login | `reauthenticateIfExpired` exported but never called | Open |
| 10 | Strictly sequential execution | Config says `workers: 2`, `fullyParallel: true`; official runs pass `--workers=1` | Open |
| 11 | Logger in `src/utils/` | No logger module exists | Open |
| 12 | `test.fixme()` for tests against broken features | Known defects asserted as actual behaviour; comments cite a non-existent "CLAUDE.md §6.4" | Practice deliberate; citation wrong |
