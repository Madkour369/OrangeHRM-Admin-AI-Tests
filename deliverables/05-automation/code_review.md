# /code-review — Framework Compliance Review

**Date:** 2026-09-25
**Scope:** everything under `src/` and `tests/` (31 files: 9 components, 1 util,
4 fixtures, 2 base pages, 13 admin page objects, 8 test specs).
**Authority:** the constitution's Playwright Design Standards (`.claude/commands/code-review.md`).

> **Superseded in part by the 2026-09-26 re-review at the end of this file.** That review found
> violation classes this one marked clean (raw oxd- selectors in test files, weak toast
> assertions, swallowed `.catch(() => false)` errors, a substring-plus-`.first()` row
> lookup). The 2026-09-25 text below is kept as the record of what was checked then.

This review found real issues — not a formality pass. Every Blocker and Major
below was fixed before this document was finalized; the findings table shows
both the original violation and the fix applied, and every fix was re-verified
against the live demo (not just typechecked).

---

## Checklist walkthrough

### A. Architecture

- [x] **Page objects contain NO expect / assertions** — 3 violations found and
  fixed (F1). `waitForIdle()`/`OxdTable.waitForListRendered()`/etc.'s own
  internal `expect()` usage is NOT a violation of this clause: those live in
  `src/utils/` and `src/components/`, which the checklist's own architecture
  section treats as a different bucket from page objects, and are the
  project's sanctioned wait-primitive mechanism throughout this whole build.
- [x] **Page objects expose behaviour, not raw locators** — holds. Every page
  object's public surface is verbs (`createX`, `selectX`, `openX`) or
  intention-named locator getters, never a bare `.locator('.some-class')`
  handed to a test.
- [x] **Raw oxd- selectors appear ONLY in src/components/** — 6 violations
  found across 4 files and fixed (F2). This is the exact pattern flagged going
  in ("you caught yourself doing this once in PayGradesPage") — it had in fact
  happened four more times, in files built at different points in the session
  before the pattern was fully internalized.
- [x] **Locators are readonly lazy fields, not resolved in constructors** —
  holds across all 13 page objects; spot-checked every constructor, all either
  take no locators or only assign already-lazy `new Oxd*(page)` component
  instances.
- [x] **Dependency direction: test -> fixture -> page -> component -> util** —
  holds, with one intentional, reviewed exception: `src/utils/fieldFactory.ts`
  imports `OxdDropdown`/`OxdAutocomplete`/`OxdCheckbox`/`OxdRadioGroup`/
  `OxdFileUpload` from `src/components/`. This is CLAUDE.md §5.1's own mandate
  — `fieldFactory.ts`'s explicit job is to be a factory that returns component
  instances (`dropdown()`, `autocomplete()`, now also `radioGroup()`,
  `fileUpload()`) — not an accidental upward dependency. No other util or
  component imports a page, fixture, or test.
- [x] **src/components, src/fixtures, src/utils, src/pages/base contain zero
  module-specific ("Admin") knowledge** — holds. The one `grep -rn "Admin"`
  hit in this whole tree (`OxdCheckbox.ts`'s comment on `OxdToggleSwitch`,
  "Configuration > Modules locks Admin/Pim Module") is a comment citing WHERE
  a trap was observed, not functional coupling — the class itself
  (`OxdToggleSwitch`) is fully generic and already reused by three different
  Admin sub-screens plus is trivially reusable by any future module.

### B. Locators

- [x] **No absolute or positional XPath** — zero `xpath=` matches anywhere in
  `src/` or `tests/`. `OxdFileUpload`'s own comment documents a positional
  XPath that was drafted for a filename getter and removed before shipping
  (Phase 1) — the getter doesn't exist.
- [x] **No generated/hashed ids; no index selection on business data** — holds.
- [x] **No .first() used to silence strict mode** — 1 violation found and fixed
  (F3: `WorkShiftsPage`'s positional From/To lookup). Every remaining `.first()`
  in the codebase was individually reviewed and is scoping to an
  already-uniquely-`filter()`ed container (the established, reviewed pattern
  from `labelledContainer`/`formContaining` onward) or is a deliberate,
  named choice on non-ambiguous structural content (`OxdAutocomplete`'s
  "select whichever real suggestion comes first" — the explicit point of that
  method; `UserManagementPage.firstRowActionIconOrder()` — the FIND-004
  regression guard's whole purpose is to inspect the first row specifically).
  None dodge a real strict-mode ambiguity on business data.
- [x] **Label-anchored factory used for form fields rather than ad-hoc CSS** —
  now holds everywhere after F2's fixes; see findings table.

### C. Waits and determinism

- [x] **Zero waitForTimeout, sleep, networkidle** — 1 violation found and fixed
  (F1: `brd.spec.ts`). `networkidle` has zero matches anywhere.
- [x] **Toast assertions are pre-armed before the triggering click** — holds;
  every `OxdToast.waitForSuccess()`/`waitForError()` call site arms the wait
  via `Promise.all` before the action, never after.
- [x] **waitForIdle() used before interaction, not as a blanket post-click
  sleep** — holds. Its 20,000ms default timeout is deliberate and documented
  in the code itself (see below) — confirmed this is still true after every
  fix in this review.
- [x] **No conditional assertions, no `if (await x.isVisible())` guards around
  expectations** — reviewed every `.isVisible().catch(() => false)` /
  `.count()` conditional in the test suite (`usr.spec.ts`'s
  `goToPageContaining`/`collectAllUserRows`, `nat.spec.ts`'s pagination walk).
  All are genuine control-flow decisions ("does pagination exist on this
  screen at all, to decide whether to walk it") made inside test HELPER
  functions, never wrapping an `expect()` call to make it conditionally skip.
- [x] **No try/catch swallowing failures; no retry loops inside tests** — the
  only `.catch()` usages are the isVisible ones above (returning a boolean
  default, not swallowing a thrown assertion), and `TestDataRegistry
  .teardownAll()`'s own best-effort cleanup loop (`src/fixtures/data.fixture.ts`),
  which collects and re-throws every cleanup failure at the end rather than
  hiding any of them — the opposite of swallowing.

### D. Test hygiene

- [x] **One test per TC_ID; title starts with the Automation_ID** — verified
  programmatically: every `TC_ADM_*` id referenced in `tests/admin/*.spec.ts`
  matches a `test_design.csv` row with `automation_wave = W1`, one-to-one, 47
  of 47, zero extras and zero gaps (re-confirmed as part of this review, not
  just carried over from the prior session).
- [x] **Tests are order-independent and create their own e2e_-prefixed data** —
  holds; every mutating test calls `testData.unique(domain)` for its own data
  and tracks its own idempotent cleanup. `nav.spec.ts` is the one file that
  doesn't use the `testData` fixture at all, by design (documented in its own
  file header) — it performs no admin-domain mutations, only login/logout.
- [x] **Teardown is guaranteed via fixture, including on failure** — holds;
  `data.fixture.ts`'s `testData` fixture runs `teardownAll()` unconditionally
  after `use()`, LIFO, best-effort per entry.
- [x] **No test.skip without a linked BUG-nnn; fixme used for product bugs** —
  zero `test.skip`/`test.fixme` calls exist. Both known-defect cases
  (`TC_ADM_NAT_010`/BUG-001, `TC_ADM_BRD_001`/BUG-002) assert the actual buggy
  behaviour directly and pass — the correct encoding per CLAUDE.md §6.4 for a
  deterministically-reproducible defect a test can positively confirm, as
  opposed to one that would need `fixme()` because it can't complete at all.
- [x] **Assertions are specific (toHaveText) rather than weak (toBeTruthy)** —
  zero `toBeTruthy` matches in `tests/`; assertions are `toHaveText`,
  `toContainText`, `toHaveCount`, `toBe`, `toBeVisible`, or comparisons against
  verbatim observed strings throughout.

### E. TypeScript and style

- [x] **strict passes, no any, no ! on locator results** — `npx tsc --noEmit`
  is clean (0 errors) after every fix in this review; zero `: any` and zero
  dangerous non-null assertions anywhere in `src/`.
- [x] **No console.log; logger used** — zero `console.log` matches. (No
  dedicated logger exists in `src/utils/` — none of this project's W1 scope
  needed one; not a finding, since nothing calls for it.)
- [x] **Naming: PascalCase classes, camelCase methods, intention-revealing
  names** — holds throughout.
- [x] **No duplication that belongs in a component or util** — this review's
  own F2 findings WERE exactly this category of violation, now fixed by
  generalizing into `fieldFactory.ts` (`formContaining`, `fieldValueText`,
  `radioGroup`, `fileUpload`, and exporting `labelledContainer`) and
  `OxdTable.cellTexts()`, rather than merely inlining a one-off fix per file.
- [x] **No dead code, no commented-out tests** — 1 finding (F4: two unused
  `UserManagementPage` getters), fixed by deletion.

### F. Safety on the shared demo

- [x] **No modification of the Admin account, Modules toggles, or global
  config without revert** — `ModulesPage`'s test only calls `.isOn()`/
  `.isDisabled()`, never `.toggle()`; `CorporateBrandingPage` has no
  Publish/Reset method at all (not merely unused — never built);
  `OrgGeneralInformationPage`'s test toggles Edit mode to observe field
  state but never calls Save. All three confirmed by reading every call site
  in `tests/`, not just the page object's own surface.
- [x] **No deletion of records the suite did not create** — every `deleteBy*`/
  `ensure*Deleted` call site is keyed by a `testData.unique()`-generated name
  the same test created; `TC_ADM_NAT_010`'s cross-module PIM step (BUG-001)
  only ever touches an employee's Nationality field, and only after
  confirming it started blank, restoring it implicitly via the bug's own
  behaviour — no PIM record is created or deleted.

---

## Findings

| ID | Severity | File:line | Clause | Issue | Fix |
|---|---|---|---|---|---|
| F1 | **Blocker** | `tests/admin/brd.spec.ts:13` | C — Zero waitForTimeout | `await page.waitForTimeout(1000)` between the upload and the assertions — the exact banned pattern. | Removed. The existing `clientLogoFilenameText()` assertion (which already needed to run) now runs FIRST and serves as the content-based readiness signal via its own auto-retry, before the `clientLogoError()` count check. |
| F2a | Major | `src/pages/admin/EmailConfigurationPage.ts:24-29` | A — Raw oxd- selectors outside components | Private `container(label)` method with an inline `.oxd-input-group`/`label, p` selector, duplicating `fieldFactory`'s own logic. | Deleted; replaced with a new `fieldFactory.radioGroup(scope, label)` export (mirrors the existing `dropdown()`/`autocomplete()` pattern). Live-reconfirmed "Sending Method"/"Use SMTP Authentication" are real `<label>` elements — the original `label, p` union was unnecessary defensiveness. |
| F2b | Major | `src/pages/admin/CorporateBrandingPage.ts:22-23,32` | A | Private `fieldGroup(label)` + inline `.oxd-input-field-error-message` selector. | Replaced with `fieldFactory.fileUpload()`, `fieldFactory.fieldError()`, and the now-exported `fieldFactory.labelledContainer()`. |
| F2c | Major | `src/pages/admin/UserManagementPage.ts:166` | A | `rows.nth(i).locator('.oxd-table-cell')` inline in `allRowValues()`. | New `OxdTable.cellTexts(row)` method; page object now calls that instead of touching `.oxd-table-cell` itself. |
| F2d | Major | `src/pages/admin/UserManagementPage.ts:188-194` | A + E (dead code) | `changePasswordToggleCheckbox`/`passwordFieldOnEditForm` getters: raw `.oxd-checkbox-wrapper` selector, an unreviewed `.first()`, and — confirmed via `grep` — never called by any test. | Deleted both getters entirely. |
| F2e | Minor | `src/pages/base/LoginPage.ts:44-46` (now with rationale comment) | A | `requiredFieldErrors` returns a raw `.oxd-input-field-error-message` locator directly. | NOT restructured — documented instead. This getter deliberately counts every visible error message across the whole 2-field login form at once; `fieldFactory.fieldError(scope, label)` is shaped for exactly one named field's message, a different contract. LoginPage also pre-dates `fieldFactory` (Phase 1) and has no per-field `.oxd-input-group` wrapper for it to anchor to. Forcing this into the per-field helper would be worse than the one documented raw selector. Added an explicit comment recording this reasoning so a future reader doesn't mistake it for an oversight. |
| F3 | Major | `src/pages/admin/WorkShiftsPage.ts:50-52` | B — No .first() to silence strict mode | `fromTrigger`/`toTrigger` used `getByRole('textbox', {name:'hh:mm'}).first()` / `.nth(1)` — positional, relying on both fields sharing an identical accessible name. | Live-confirmed From/To each have their own real `<label>` inside a normal `.oxd-input-group`. Replaced with `field(this.page, 'From')` / `field(this.page, 'To')` — label-anchored, matches the standard pattern used everywhere else in the codebase. |
| F4 | **Major** (found during this review, not pre-existing in the checklist's own list) | `src/pages/base/BasePage.ts:80-91`, `src/pages/base/LoginPage.ts:66-69`, `tests/admin/nav.spec.ts:30` | B + C — a real, currently-latent strict-mode risk | `getByRole('img', {name:'profile picture'})` used UNSCOPED in `BasePage.openUserMenu()`, `LoginPage.logout()`, and directly in `TC_ADM_NAV_001`. Live-diagnosed while verifying an unrelated fix: the Dashboard's Buzz feed, Attendance, and Leave widgets can ALL render their own `alt="profile picture"` images (post authors' avatars, the viewer's own photo in an attendance/leave card) — confirmed via direct DOM inspection to total **8 matches** on one real load, only 1 of which is the real topbar control every one of these three call sites actually wants. This had not yet caused an observed test failure (favorable load-timing so far, or content-dependent — the Buzz feed's post count varies with real concurrent users), but is a real, reproducible ambiguity waiting to strike, not a hypothetical. Every test that logs in or out exercises at least one of these three call sites. | Scoped all three to `getByRole('banner')` first (confirmed to resolve to exactly 1 match) — the same pattern `BasePage.breadcrumbText()` already used for the identical "topbar vs. main-content" ambiguity class. |
| F5 | Minor (bundled into F4's fix) | `src/pages/base/BasePage.ts:36`, `src/pages/base/LoginPage.ts:50` | A — no expect in page objects | `expect(this.sidebar).toBeVisible()` / `expect(this.usernameInput).toBeVisible()` — literal `expect()` calls inside page objects. | Both replaced with `.waitFor({state:'visible'})` — functionally identical content-based wait, without invoking the `expect` assertion API from a page object. |

**No Blockers remain.** F1 was the only Blocker found, and it is fixed.

---

## Verdict: **APPROVED**

Every Blocker and Major found was fixed and re-verified. `npx tsc --noEmit`
is clean. The full 47-test suite was re-run after all fixes above: **46/47
green**, with the 1 failure (`TC_ADM_ORG_007`, a `page.goto()` timeout inside
the shared worker fixture — a file this review did not touch) confirmed
transient by an immediate isolated re-run of the same spec file (4/4 clean,
6.0s vs. the prior 30s timeout). That single transient failure belongs to
Phase 3 Step 2 (three full-suite runs) to characterize properly, not to this
review — recorded here for continuity into that step.

**Specifically confirmed per the review brief's own emphasis:**

- **Raw oxd- selectors outside `src/components/`:** found in 5 more places
  beyond the one self-caught in `PayGradesPage` (F2a-e above) — all fixed or,
  for the one narrow LoginPage exception, explicitly documented rather than
  force-fit into a helper that doesn't match its actual contract.
- **`expect()`/assertions inside page objects:** found in 2 places
  (`BasePage.gotoPath`, `LoginPage.goto`) — both were content-based waits, not
  test assertions, but used the literal `expect` API; both switched to
  `.waitFor()` to remove that API surface from page objects entirely while
  keeping identical wait behaviour.
- **Module-specific knowledge in `src/utils`, `src/components`, `src/fixtures`,
  `src/pages/base`:** none found. The one "Admin" text match is a comment
  citing where an observation was made, not functional coupling.
- **`OxdTimePicker`'s forced click and `waitForIdle`'s longer timeout:** both
  already carry the full evidence-backed explanation directly in the code
  (see `src/components/OxdTimePicker.ts`'s class comment and
  `src/utils/fieldFactory.ts`'s `waitForIdle` comment) — reviewed and
  confirmed intact; no changes needed.
- **Banned patterns** (`waitForTimeout`, `networkidle`, `.first()` to dodge
  strict mode, conditional assertions, swallowed failures, positional XPath):
  one live instance of `waitForTimeout` (F1) and one live instance of
  positional `.first()`/`.nth()` (F3) found and fixed; every other category
  came back clean.

**Typecheck after every fix:** `npx tsc --noEmit` — 0 errors.

---

# Re-review — 2026-09-26 (full, post-G5)

**Scope:** everything under `src/` and `tests/` after the 5 P0 cases were promoted (52
tests; 2 new PIM page objects added by this review's fixes).
**Method:** every checklist clause was run as a mechanical search over all files, not
only page objects, and each hit was then read in context.

## Why the 2026-09-25 review missed these

- **A3, raw oxd- selectors:** that review searched page objects (and found 6) but not
  `tests/`. There were 17 live raw selectors in 5 of the 8 spec files.
- **C5, swallowed failures:** it saw every `.isVisible().catch(() => false)` and judged
  them "returning a boolean default, not swallowing". That was wrong. The catch turns
  *any* error (strict-mode violation, detached frame, closed page) into `false`, not
  just "element absent".
- **D5, weak assertions:** it searched only for `toBeTruthy`. `expect(text.length)
  .toBeGreaterThan(0)` is the same weakness in a different form.

## Findings

| ID | Severity | File:line (before fix) | Clause | Issue | Fix applied |
|---|---|---|---|---|---|
| R1 | **Blocker** | `usr.spec.ts` 125/143/169/187/205, `job.spec.ts:51`, `qua.spec.ts:35`, `org.spec.ts:55`, `nat.spec.ts` 95/110/136 | A3 | Raw `.oxd-toast-content--success` in test files (11 lines) | New `OxdToast.successToastCount()`; tests call it through each page object's `toast` |
| R2 | **Blocker** | `nat.spec.ts` 40/45/56/133/167/172 | A3, B2, B3 | Inline PIM helpers with raw table and form selectors, `.first()`, positional `.nth(i)…nth(2)` column click, and raw `nth-child(2)` inside `evaluateAll` | New `src/pages/pim/EmployeeListPage.ts` and `PersonalDetailsPage.ts`; new `OxdTable.cell(row, header)` / `columnTexts(header)` resolve columns by header text |
| R3 | Major | `src/pages/base/LoginPage.ts:45` | A3 | Raw `.oxd-input-field-error-message` in a page object, under a self-granted waiver the checklist does not provide for | Moved to `fieldFactory.allFieldErrors(scope)` |
| R4 | Major | `usr.spec.ts:298`, `usr.spec.ts:339`, `job.spec.ts:115`, `qua.spec.ts:98`, `nat.spec.ts:148` | D5 | `expect(toastText.length).toBeGreaterThan(0)` passes on any wording | Observed live and asserted verbatim: `toBe('Successfully Deleted')` (exploration.md Addendum A). `OxdToast` now returns the message line, not the title+message concatenation |
| R5 | Major | `OxdTable.ts` 66/187/234, `usr.spec.ts` 31/56 | C5 | `.isVisible().catch(() => false)` swallows every failure | Count-based `OxdTable.isEmpty()` / `hasPagination()`, which cannot throw. The equivalence with `isVisible()` was checked live: both elements are detached, not hidden, when absent |
| R6 | Major | `OxdTable.ts:110` `row()` | B3, CLAUDE.md §5.1 | `filter({ hasText }).first()`: substring match with strict mode silenced. `row('e2e_x')` also matched `e2e_x_edited`, so an "original still exists" check would pass even if an edit had wrongly been saved | Exact whole-cell match (`getByText(text, { exact: true })`), no `.first()`. An exact duplicate now fails loudly |
| R7 | Major | same lines as R1 | D5 | `await expect(toast).toHaveCount(0)` retries for up to 10 s, and toasts auto-dismiss in ~3–5 s. A success toast that *did* appear would still pass once it faded | `successToastCount()` is a single non-retrying read, taken after the field error is already asserted visible |
| R8 | Minor | `usr.spec.ts` `goToPageContaining` / `collectAllUserRows` | E4 | Re-implemented the pagination walk that `OxdTable` already owns | Use `table.findRowAcrossPages()` and the new `table.pageNumbers()` |
| R9 | Minor (open) | `OxdTree.ts` 32/37/42/52 | B3 | `.first()` after exact-label filters. `node()` filters `.oxd-tree-node` by a descendant wrapper, so ancestor `<li>`s also match and `.first()` picks the outermost | **Not changed.** A correct direct-child selector needs live DOM verification first (manual-first rule). Child lookups still match an exact label, so no false pass is possible today |
| R10 | Minor (open) | `fieldFactory.ts` 63/79/84/89/99, `OxdCheckbox.ts` 21/78 | B3 | `.first()` after exact-label or pre-narrowed scoping | Not changed. None is known to resolve an ambiguity in this suite. Revisit if a duplicate label is ever observed |
| R11 | Minor (open) | `nav.spec.ts:115` | A2 | Raw `getByRole('banner')…heading.first()` readiness wait in a test | Not changed. It should become a `BasePage` method next time `nav.spec.ts` is touched |

**Accepted by design (not findings):** `OxdAutocomplete.selectFirstSuggestion()` picks
the first hint on purpose, because any employee will do. `OxdTable.waitForListRendered()`
and `UserManagementPage` (FIND-004 guard) use `rows.first()` because "the first row" is
the intent there. The `.nth()` hits are row iteration or header-derived column indexes.
`fieldFactory.ts` contains oxd- selectors because CLAUDE.md §5.1 mandates the
label-anchored factory there. The `try/catch` in `TestDataRegistry.teardownAll()`
collects every error and rethrows them together, so it swallows nothing.

## Clean on re-check

No `expect` in page objects. No raw oxd- selectors in `tests/`, `src/pages/` or
`src/fixtures/`. No module-specific knowledge in shared layers. No XPath,
`waitForTimeout`, `networkidle` or `isVisible()` guards. No `test.skip`/`only`/`fixme`.
No `any`, non-null `!` or `console.*`. All 52 titles start with their TC_ID.

## Verification

- `npx tsc --noEmit`: 0 errors.
- Targeted run of the 15 tests on changed code paths (`--workers=1 --retries=0`):
  **15/15 passed** (JOB_007/008, QUA_002/008, NAT_002/003/010/011, ORG_007,
  USR_002/003/013/020/022, NAV_005).
- The full 52-test run follows; its result is recorded in PROGRESS.md and in
  `deliverables/05-automation/runs/`.

## Verdict: **APPROVED WITH MINORS**

Both Blockers and all 5 Majors are fixed and verified. The 3 open Minors (R9–R11) do not
weaken any assertion today, and each has a stated condition for revisiting it.
