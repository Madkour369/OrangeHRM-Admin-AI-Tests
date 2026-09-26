# M5 Automation Progress

Tracks Playwright automation build progress across sessions. Build order per the M5
brief: components → page objects → tests. Scope: `automation_wave = W1` (47 cases).

---

## Log (newest entry last)

### 2026-09-24 ~12:35 UTC — Phase 1 (Foundation) complete, verified live

All Phase 1 deliverables built, typechecked clean (`npx tsc --noEmit`, strict mode,
zero errors), and the critical path (real UI login → authenticated page) verified
against the real live demo, not just compiled.

**Built:**
- `src/utils/scope.ts` — `isPage()` type guard shared by every component that
  accepts `Page | Locator`.
- `src/utils/fieldFactory.ts` — `field()`, `dropdown()`, `autocomplete()`,
  `checkbox()`, `waitForIdle()`, `uniqueValue()`. Only `.oxd-input-group` appears
  here (CLAUDE.md §5.1's own explicit exception for this file) — every other oxd-
  class lives inside a component; `dropdown()`/`autocomplete()`/`checkbox()` just
  find the labelled container and return the matching component instance.
- `src/components/` — all 8 named components: `OxdDropdown`, `OxdAutocomplete`,
  `OxdToast`, `OxdTable`, `OxdDialog`, `OxdCheckbox` (+ `OxdRadioGroup`, same file),
  `OxdDatePicker`, `OxdFileUpload`. Every selector is either from exploration.md §6's
  Locator Risk Register or independently live-verified this session (see "Real
  findings" below) — none invented.
- `src/pages/base/BasePage.ts` + `LoginPage.ts`. `LoginPage` deliberately does not
  extend `BasePage` (unauthenticated screen, no sidebar).
- `src/fixtures/auth.fixture.ts`, `page.fixture.ts`, `data.fixture.ts`, `index.ts` —
  worker-scoped real UI login (once per worker, storageState reused per CLAUDE.md
  §2's exact rule), `reauthenticateIfExpired()` for session-expiry mid-test,
  module-agnostic `page` fixture, and a `TestDataRegistry` (`testData` fixture) that
  runs registered cleanups in reverse order, best-effort, even after a test failure.
- `playwright.config.ts` rewritten to the exact spec: `workers: 2`, `retries: 1`
  (2 in CI), `timeout: 90_000`, `expect.timeout: 10_000`, `actionTimeout: 15_000`,
  `navigationTimeout: 30_000`, `trace: 'on-first-retry'`, `video:
  'retain-on-failure'`, `screenshot: 'only-on-failure'`, `baseURL` set. Only a
  `chromium` project — Firefox/WebKit were never exercised against this build by
  either M2 or M4, so configuring them would assert cross-browser coverage this
  project has never actually observed.
- `tsconfig.json`/`package.json` updated for the `src/`+`tests/` layout (stale
  `pages/`/`utils/`-root references and dead `test:login`/`test:search`/`test:create`
  scripts removed — those pointed at files deleted at Gate G2).

**Real findings during foundation verification (not hypothetical — hit and fixed live):**
1. A temporary smoke test (`worker auth fixture` → `page` fixture → assert sidebar
   visible) FAILED on its true first attempt: `waitForIdle()`'s
   `.oxd-loading-spinner` count never reached 0 within the global 10s `expect`
   timeout, resolving to 6/5/4/3/2/1 elements over the wait window. Diagnosed live
   (not guessed): the Dashboard renders several independent widgets, each with its
   own `.orangehrm-dashboard-widget-loader` > `.oxd-loading-spinner`; on a cold
   post-login load, 1-2 widgets can still be resolving past 10s (confirmed by direct
   re-check ~8s later: count was 0). This is a genuine timing characteristic of this
   specific multi-widget page, not a stuck/broken spinner and not a locator error.
   **Fix:** `waitForIdle()` now takes an explicit `timeoutMs` parameter (default
   20,000ms) instead of relying solely on the global `expect.timeout` — a longer,
   still-conditional element-state wait, never a blind sleep, per this project's own
   healing discipline (a fix that "only adds a hard wait" is rejected; this escalates
   the *timeout* on an existing correct element-state assertion, which is different).
   Re-ran the smoke test from a fully fresh worker (deleted `.auth-state`, `retries:
   0`): passed cleanly on the true first attempt, 19.6s. This is exactly the kind of
   discovery Phase 1 is supposed to surface before Phase 2 builds on top of it.
2. `openUserMenu()` was initially drafted against `.oxd-userdropdown-tab` /
   `.oxd-topbar-header-userarea` — guessed class names, never actually observed.
   Caught during self-review (not a live failure) and replaced with
   `getByRole('img', { name: 'profile picture' })`, which IS confirmed (alt text
   seen in every M2/M4 topbar snapshot) and is also immune to the topbar's linked
   employee display name drifting mid-project ("manda user" → "mandaa Brooks",
   another real concurrent party on the shared demo).
3. `breadcrumbText()` was initially unscoped (`page.getByRole('heading', {level:6})`),
   which would have also matched each screen's own main-content title heading (also
   rendered as a level-6 heading) — caught before it shipped; scoped to
   `getByRole('banner')` first.
4. Login page selectors were live-verified against real HTML, not assumed from the
   accessibility tree alone: error banner is `role="alert"` wrapping
   `.oxd-alert-content-text` (confirmed — this exact class also matches what a
   pre-Gate-G2 stock LoginPage.ts had used, so that detail was accurate), field-level
   errors are `.oxd-input-field-error-message` (also confirmed, same file).
5. A positional XPath (`following-sibling::*[1]`) was drafted for
   `OxdFileUpload.selectedFileName` and then removed before shipping — CLAUDE.md
   §5.1 forbids positional XPath outright, and no W1 case needs that getter. Noted
   in the file for whoever adds it later to use a real observed selector, not a guess.

**Module-agnostic check:** `grep -rn "Admin" src/utils src/components src/fixtures
src/pages/base` returns exactly one hit — the literal login username default
(`'Admin'`) in `auth.fixture.ts`, which is the site's one platform-wide demo
credential (used to reach every module, not Admin-module-specific), not a module
coupling. All explanatory comments that referenced "Admin" have been reworded to be
fully generic.

**plan.md note:** `.specify/specs/001-admin-ui/plan.md` is still the stale
pre-Gate-G2 version (root-level `pages/`, `TC_ADM_xx_nnn` naming, 4-milestone model)
— it was never updated when CLAUDE.md was ruled authoritative. This build followed
CLAUDE.md's actual `src/` layout and this project's real TC_ID/gate conventions, not
plan.md's directory structure, consistent with the G2 ruling. plan.md itself was not
edited (out of scope for this milestone).

**Typecheck:** `npx tsc --noEmit` — 0 errors, strict mode.

**Next:** Phase 2 (page objects + tests), pending go-ahead per the M5 brief's explicit
stop-and-report instruction after Phase 1.

---

### 2026-09-24 ~12:45 UTC — Two post-approval fixes, both re-verified live

1. **plan.md reconciled.** `.specify/specs/001-admin-ui/plan.md` was still the stale
   pre-G2 version. Rewritten in place: actual `src/` layout (including
   `OxdRadioGroup`, not in the original plan — added because the observation
   demanded it), the real 5-milestone/gate table, chromium-only with the no-other-
   browser-observed reasoning, and the `waitForIdle()` timeout decision with why a
   longer element-state wait (not a sleep) was the correct fix. No standard weakened
   — only the stale structural description changed.
2. **Credential moved out of shared code.** `src/fixtures/auth.fixture.ts` no longer
   contains any hardcoded fallback — it calls `requireEnv('ORANGEHRM_USER')` /
   `requireEnv('ORANGEHRM_PASSWORD')` and throws loudly if unset. The actual default
   (`Admin`/`admin123`) now lives in `playwright.config.ts` (`process.env.ORANGEHRM_USER
   ??= 'Admin'`), which is project-level configuration, not one of the four
   module-agnostic directories. `grep -rn "Admin" src/utils src/components
   src/fixtures src/pages/base` → confirmed zero hits (exit code 1).

Both changes re-verified against the real live demo (not just typechecked): a fresh
worker (no cached `.auth-state`), zero retries, real UI login via the new env-based
credential path — clean pass, 7.1s.

**Typecheck after both fixes:** 0 errors.

---

### 2026-09-24 ~20:20 UTC — Phase 2, USR screen complete: 9/9 green, 3 consecutive clean runs

**Built:**
- `src/pages/admin/UserManagementPage.ts` — Add/search/edit/delete/bulk-delete/
  FIND-004 icon-order behaviour methods. Zero raw oxd- selectors (everything via
  `field()`/`dropdown()`/`autocomplete()`/component instances); locators are lazy
  getters/methods, never resolved in the constructor.
- `tests/admin/usr.spec.ts` — all 9 W1 USR cases (TC_ADM_USR_001, 002, 003, 009,
  013, 018, 020, 022, 024), one `test()` per TC_ID, titles starting with the
  Automation_ID.
- `src/utils/fieldFactory.ts` — added `fieldError()`; rewrote `labelledContainer()`
  (see finding 1 below).
- `src/components/OxdAutocomplete.ts` — `selectFirstSuggestion()` hardened (finding
  2). `src/components/OxdTable.ts` — `rows`/`row()` scoped to `.oxd-table-body`,
  `recordCount()`/`emptyState`/`recordCountHeader` rescoped to a new
  `listContainer`, `clickSearch()`/`clickReset()` now wait for real render (findings
  3, 5, 6). `src/components/OxdDialog.ts` — `confirmButton` de-`exact`'d (finding 4).

**Result:** 9/9 passing, confirmed on 3 consecutive clean runs (no retries) —
`npx playwright test tests/admin/usr.spec.ts --workers=1 --retries=0`.

**Real findings, all hit live and fixed at root cause (not papered over):**

1. **`labelledContainer()` never matched anything on the Add User form.**
   `hasText` was matched against the CONTAINER's full `textContent`, which
   concatenates the label with its sibling control's own text with no newline
   (e.g. `"User Role-- Select --"`), so an anchored `^label$` regex could never
   match; the required-field `*` is also a CSS `::after`, never real DOM text.
   Compounding it, `.oxd-form-row` is not a per-field wrapper on this form — it
   wraps the entire 4-field section — so including it in the selector union let
   `.first()` grab the too-broad row and pull in a second field's control (strict-
   mode violation). Fixed by scoping to a `<label>` descendant's own exact text,
   inside `.oxd-input-group` only (CLAUDE.md §5.1's own worked example), confirmed
   live to resolve to exactly one match on both the Add form and the search panel.

2. **`OxdAutocomplete.selectFirstSuggestion()` could silently select nothing.**
   Between "No Records Found" and real results, the dropdown briefly renders a
   THIRD placeholder — literally `"Searching...."` — while the debounced request is
   in flight. The original filter only excluded "No Records Found", so under real
   timing it could click the "Searching...." placeholder (not a real, selectable
   option); nothing happens, the field stays on its raw typed text, and the form
   later fails validation ("Invalid") with no exception anywhere in the method.
   Fixed by excluding that placeholder too and reading the input's actual applied
   value AFTER the click instead of a pre-click `textContent()` read.

3. **The table header row shares the `.oxd-table-row` class with every data row.**
   `.oxd-table` has exactly two children, `.oxd-table-header` and `.oxd-table-body`,
   and BOTH the header row and data rows render as `<div class="oxd-table-row">`.
   An unscoped `.oxd-table-row` query double-counted the header as an extra row
   (broke TC_ADM_USR_013's count assertion) and could hand the header to a caller
   expecting the first DATA row (would have broken TC_ADM_USR_024's icon check).
   Fixed via a new `OxdTable.rows` getter scoped to `.oxd-table-body .oxd-table-row`.

4. **Three buttons' icons contribute an extra character to their accessible name,**
   breaking `exact: true` name matching: the list screen's `Add` button (real name
   `" Add"`), the delete-confirm dialog's `Yes, Delete` button (`" Yes, Delete"` —
   its icon-less sibling `No, Cancel` has a clean name, confirmed via
   `dialog.ariaSnapshot()`), and the bulk-select toolbar's `Delete Selected` button
   (`" Delete Selected "`). All three fixed by dropping `exact: true` (substring
   match); `Save`/`Cancel`/`Search`/`Reset` were independently confirmed to have
   clean names and needed no change.

5. **The empty-state message and the record-count header are NOT inside `.oxd-table`
   at all** — both are siblings of it, under a shared `.orangehrm-paper-container`
   ancestor (confirmed via direct DOM inspection). A zero-result search ALSO pops an
   info toast reading the identical "No Records Found" text, living entirely outside
   that container. `OxdTable.emptyState`/`recordCountHeader` are now scoped to a new
   `listContainer` (`.orangehrm-paper-container`) — the only scope that includes
   both real states but excludes the toast.

6. **A real timing race in `waitForIdle()`-based search waits:** the spinner-gone
   check can resolve BEFORE the spinner ever mounts — it only asserts the current
   count is 0, and immediately after a click the fresh request may not have added
   the spinner yet, so the check trivially passes while the table is still
   mid-refresh (caught via `allRowValues()` returning a row list that didn't yet
   contain the just-edited record). Fixed with a content-based wait —
   `OxdTable.clickSearch()`/`clickReset()` now wait for either the record-count
   header or the empty state to actually render — which can't race the same way.
   `waitForIdle` remains a supplementary settle-check, not the sole signal.

7. **The Username search filter is an EXACT match, not a substring/contains
   match** — confirmed directly: searching a true prefix of a real, live username
   still returned "No Records Found". This invalidated the original
   TC_ADM_USR_022 design (filtering by a shared substring to show two new records
   at once). Redesigned: the unfiltered list sorts alphabetically (confirmed live),
   so two `e2e_<domain>_<...>` users created back to back share a literal prefix
   and land on the same page; a new `goToPageContaining()` test helper walks the
   unfiltered, paginated list to find it. Post-delete verification now checks each
   specific username individually rather than an unfiltered total-count delta,
   which would have been vulnerable to concurrent real users on this shared demo.

8. **TC_ADM_USR_018's Expected_Result string was wrong for the flow it names.**
   The CSV/exploration.md recorded "Successfully Saved" for the edit-role save
   toast, but the flow actually shows **"Successfully Updated"** (live-observed,
   `waitForSuccess()` return value) — that wording was correct for Add User, not
   Edit User. Asserting the verbatim string this flow actually produces, not the
   one recorded for a different flow. Test_design.csv/exploration.md are the
   source of record and should be corrected to distinguish the two toasts if a
   later milestone revisits them; not edited here (out of scope for Phase 2).

**Also observed, not test-blocking:** selecting the built-in `Admin` account's own
row checkbox does not reveal the bulk-selection toolbar (a different, non-Admin row
does) — plausibly a safeguard against bulk-deleting the logged-in account; none of
the W1 cases select that row, so no code change followed. Also observed a live
"Periodic data reset" (CLAUDE.md §5.3) mid-session — the shared demo's System Users
list dropped from 60 to 7 records between two points in this session; several
`e2e_`-prefixed orphans left by earlier failed runs (from finding 4, before it was
fixed) were manually deleted via the same corrected delete flow once confirmed live.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Next:** JOB screen (page object + tests), per the mandated USR → JOB → QUA → NAT →
ORG → BRD → CFG → NAV order.

---

### 2026-09-24 ~20:35 UTC — Phase 2, JOB screen (Job Titles) complete: 6/6 green, 2 consecutive clean runs; USR re-confirmed 9/9 after shared-file changes

**Built:**
- `src/pages/admin/JobTitlesPage.ts` — Add/edit/cancel/delete behaviour methods.
  Zero raw oxd- selectors, zero assertions, lazy locators. Reused the User
  Management screen's exact shared chrome (`OxdTable`, `OxdToast`, `OxdDialog`,
  `field()`/`fieldError()`) with no screen-specific component changes needed beyond
  the two general-purpose fixes below.
- `tests/admin/job.spec.ts` — all 6 W1 JOB cases (TC_ADM_JOB_001, 002, 006, 007,
  008, 009 — the Job Titles subset; the other JOB W1 cases belong to Pay Grades /
  Employment Status / Job Categories / Work Shifts, not yet built).

**Result:** 6/6 passing, confirmed on 2 consecutive clean runs. USR re-run after
touching two shared files (`OxdTable.ts`, both screens' `goto()`) — still 9/9.

**Real findings, both general architecture fixes (not Job-Titles-specific), hit
live and fixed at root cause:**

1. **`gotoPath()`'s readiness check doesn't cover table data on FIRST navigation,
   not just after a search click.** TC_ADM_JOB_006 (edit, verify by reading the
   list) doesn't route through `clickSearch()` at all — Job Titles has no search
   panel — so the same "spinner-gone can resolve before the spinner ever mounts"
   race from the USR entry's finding 6 showed up on a bare `goto()` too: the header
   count was genuinely correct (confirmed via screenshot showing the right total)
   but reading rows immediately after could still race the table's own data fetch.
   `OxdTable`'s render-wait was made public (`waitForListRendered()`, renamed from
   the USR-entry's private `waitForSearchToRender()`) and is now called from both
   `JobTitlesPage.goto()` and `UserManagementPage.goto()` (the latter for
   consistency/future-proofing — every existing USR test happens to search before
   reading rows, so it was not currently exposed there, but the same gap exists in
   principle). Re-confirmed USR still 9/9 after this change.

2. **A second, distinct instance of the same race on the EDIT form specifically:**
   `openEditByTitle()`'s `waitForIdle()` can resolve before the edit form has
   hydrated with the record's actual data, so `jobTitleField().fill(newTitle)` can
   run against a field that hasn't received its old value yet. Root-caused by
   reproducing the exact flow twice — a careful, hand-paced manual reproduction via
   the browser tool succeeded every time (ruling out an app bug), while the
   automated test's tighter timing hit it reproducibly. New general-purpose utility
   `waitForFieldPopulated()` added to `fieldFactory.ts` (not the page object, which
   CLAUDE.md keeps assertion-free) — waits for a label-anchored field to hold a
   non-empty value, confirming real data has arrived. Applied to
   `JobTitlesPage.openEditByTitle()`; not retrofitted onto
   `UserManagementPage.openEditByUsername()` since that one has run clean on 3
   consecutive USR suites — noted here as a candidate if it's ever observed to flake.

**Also confirmed, not a change:** Save/Cancel button accessible names are clean on
this form too (no icon-glyph issue, consistent with the Add User form); the dialog,
toast, and icon-glyph "Add" button findings from the USR entry all reproduced
identically here with zero screen-specific handling needed — the shared-component
architecture is holding up as intended.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Next:** QUA screen (Qualifications — Skills full battery per exploration.md;
Education/Licenses/Languages/Memberships confirmatory), per the mandated order.

---

### 2026-09-24 ~20:42 UTC — Phase 2, QUA screen (Skills) complete: 7/7 green, 2 consecutive clean runs, no new fixes needed

**Built:**
- `src/pages/admin/SkillsPage.ts` — Add/edit/cancel/delete behaviour methods, plus
  a `description` parameter on `createSkill()` for the long-description case. Zero
  raw oxd- selectors, zero assertions, lazy locators. Route confirmed live:
  `/web/index.php/admin/viewSkills`; fields confirmed live: `Name*` (text),
  `Description` (textarea, placeholder "Type description here").
- `tests/admin/qua.spec.ts` — all 7 W1 QUA cases (TC_ADM_QUA_001, 002, 006, 007,
  008, 009, 010 — the Skills subset; Education/Licenses/Languages/Memberships are
  not in W1).

**Result:** 7/7 passing on the FIRST attempt, confirmed on a second consecutive
clean run. No new findings, no code changes to shared components this screen — the
`goto()` render-wait and `openEditByName()`'s `waitForFieldPopulated()` (both
generalized from the JOB screen's findings, not Skills-specific) worked correctly
on the first try. This is the intended payoff of the shared-component architecture:
a third CRUD screen built on the same `OxdTable`/`OxdDialog`/`OxdToast`/
`fieldFactory` foundation needed zero screen-specific locator work.

TC_ADM_QUA_010 (398-character Description, zero truncation) also passed cleanly —
confirms exploration.md §2.4's M2 finding still holds on this build.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Next:** NAT screen (Nationalities), per the mandated USR → JOB → QUA → NAT → ORG →
BRD → CFG → NAV order. Note: exploration.md documents BUG-001 (Nationality delete
silently orphans employee data) — any W1 NAT case touching delete must assert the
ACTUAL (buggy) behaviour, never the desired-but-absent one, per CLAUDE.md §6.4.

---

### 2026-09-25 ~00:15 UTC — Phase 2, NAT screen (Nationalities) complete: 5/5 green, 2 consecutive clean runs; USR/JOB/QUA re-confirmed 22/22 after shared-file changes

**Built:**
- `src/pages/admin/NationalitiesPage.ts` — Add/cancel/delete behaviour methods.
  Route confirmed live: `/web/index.php/admin/nationality` (reached only via the
  topbar's "More" menu, not a direct tab — confirmed live). Field: `Name*` only.
  Row lookups go through the new `OxdTable.findRowAcrossPages()` (below), not the
  plain `table.row()` other screens use — this list has no search panel and ~193
  seeded records across 4 real pagination pages (confirmed live), so a target row
  is frequently not on the current page.
- `tests/admin/nat.spec.ts` — all 5 W1 NAT cases (TC_ADM_NAT_001, 002, 003, 010,
  011). TC_ADM_NAT_010 is the BUG-001 known-defect case; TC_ADM_NAT_011 is the
  pagination-integrity case — the only screen in Admin where this is meaningful.

**Result:** 5/5 passing, confirmed on 2 consecutive clean runs. USR (9), JOB (6),
and QUA (7) — 22 tests total — re-run after touching `OxdTable.goToPage()`: still
22/22.

**Real findings:**

1. **`OxdTable.findRowAcrossPages()` added** (general capability, not
   Nationalities-specific): walks numbered pagination pages until a row matching
   the target text is found. `OxdTable.goToPage()` was also upgraded to use
   `waitForListRendered()` instead of a bare spinner-gone check, for the same
   race-safety reason as every other list-rendering fix in this log.

2. **TC_ADM_NAT_010 (BUG-001) needed real cross-module verification** — the CSV's
   own test steps require assigning the owned Nationality to a real PIM employee,
   deleting it, then confirming the employee's field silently resets. Implemented
   by dynamically scanning a bounded number of PIM employees (never hardcoding a
   specific one, since this shared demo's employee data drifts) for one whose
   Nationality is currently blank, temporarily assigning it, then relying on the
   bug itself to restore that employee to their original blank state — no manual
   cleanup needed, confirmed self-cleaning. Full cycle reproduced live via the
   browser tool before writing any test code (generic dialog text, "Successfully
   Deleted" toast, employee's Nationality silently reset to "-- Select --" after
   reload) — matches exploration.md §2.5/§5 exactly. Asserted directly (not
   `test.fixme()`) so the test actively regression-guards the defect, per
   CLAUDE.md §6.4.

3. **A third, more stubborn instance of the "spinner-gone resolves too early"
   race, on PIM's Personal Details route specifically:** unlike the Admin list
   screens, this route showed an actual flicker — the Nationality dropdown could
   become briefly visible (an optimistic/partial render) and then disappear again
   before the real per-employee data arrived, so even a content-based
   "wait for the field to appear" check could resolve during the wrong window (a
   screenshot at the moment of failure showed the form area still empty/spinning
   after that check had already passed). Root-caused by checking the browser's own
   network log for the real data-loading call
   (`GET .../pim/employees/{id}/personal-details`) and switching to a pre-armed
   `page.waitForResponse()` for that specific endpoint — a precise, deterministic
   signal (not the banned `networkidle` heuristic, which polls all traffic
   including analytics) — armed before both the direct-URL navigation and the
   list-row click that leads to it, since the target empNumber isn't known before
   the click in the latter case.

4. **The Personal Details "Save" click had the same silent-persistence risk as
   the earlier USR/JOB/QUA toast races:** confirmed this specific Save action does
   show a `.oxd-toast-content--success` toast, and pre-armed the wait for it
   (`Promise.all`) before the click, rather than trusting `waitForIdle()` alone —
   navigating away (the verification reload) before the save's async request
   actually completes was reproducible without this fix.

**Also confirmed, not a change:** the Add/Cancel/Save buttons and delete dialog on
this screen are clean (no icon-glyph accessible-name issue); "Already exists" is
verbatim-confirmed for duplicate Name here too.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Next:** ORG screen (Organization — General Information, Locations; Structure is
observation-only per exploration.md §2.3, "not recommended" for mutation on this
shared instance), per the mandated order.

---

### 2026-09-25 ~00:35 UTC — Phase 2, ORG screen (General Information, Locations, Structure) complete: 4/4 green, 2 consecutive clean runs

**Built:**
- `src/pages/admin/OrgGeneralInformationPage.ts` — read-only observation of the
  Edit-toggle behaviour (no save). Route:
  `/web/index.php/admin/viewOrganizationGeneralInformation`.
- `src/pages/admin/LocationsPage.ts` — Add/validate + a cleanup-only delete (no W1
  delete test case exists for this screen). Route: `/web/index.php/admin/viewLocations`.
- `src/pages/admin/OrgStructurePage.ts` — thin wrapper delegating to a new
  `OxdTree` component. Route: `/web/index.php/admin/viewCompanyStructure`.
  Read-only by design — exploration.md §2.3 judged mutation "Not recommended" here
  (deletes cascade to children, no disposable seed data on this shared instance).
- `src/components/OxdCheckbox.ts` — added `OxdToggleSwitch` (a new oxd trap: the
  "Edit" control here is `.oxd-switch-wrapper`, a different component from the
  checkbox, same wrapper-click-not-input fix). Also widened its and
  `OxdToggleSwitch`'s constructors to accept `Page | Locator` (matching
  `OxdTable`'s pattern) so page objects never need to touch a raw class selector.
- `src/components/OxdTree.ts` — new component for the lazy-expand tree (see
  finding 2). `tests/admin/org.spec.ts` — all 4 W1 ORG cases (TC_ADM_ORG_001, 006,
  007, 019) across the three sub-screens.

**Result:** 4/4 passing, confirmed on 2 consecutive clean runs.

**Real findings:**

1. **The CSV's Test_Data for TC_ADM_ORG_006 was incomplete.** It names only
   `Name=e2e_<screen>_<ts>`, but live-diagnosed via a stalled-save screenshot:
   `Country*` is ALSO genuinely mandatory on this form — leaving it unselected
   blocks Save with a "Required" error and no toast ever appears.
   `LocationsPage.createLocation()` now always selects a Country (default `United
   States`, overridable).

2. **`OxdTree`'s first draft mis-mapped the DOM from the accessibility tree's
   shape and needed a real fix, not just a timeout bump:** the accessibility
   snapshot showed the expand button as if it were inside the same wrapper as the
   node's label, so the first draft scoped `expandToggle()` to
   `.oxd-tree-node-content`. Direct DOM inspection showed the button actually
   lives in a SIBLING `<span class="oxd-tree-node-toggle">`, one level up in
   `.oxd-tree-node-wrapper` — `.oxd-tree-node-content` itself contains zero
   `<button>` elements, so every lookup through it timed out. Fixed by scoping to
   `.oxd-tree-node-wrapper` instead (confirmed its own text also stays exactly the
   node's label regardless of expansion state, for the same reason documented for
   `.oxd-tree-node-content` in the class's comment — children live in a further
   sibling `<ul>`, not inside the wrapper).

**Also confirmed, not a change:** Locations' Save/Cancel and dialog patterns are
identical to every other list screen; General Information's disabled/enabled field
toggling matches exploration.md §2.3's M2 finding exactly.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Next:** BRD screen (Corporate Branding), per the mandated order. Note:
exploration.md documents BUG-002 (misleading file-type error) on this screen, and
Corporate Branding is reached via the topbar's "More" menu (confirmed pattern from
Nationalities) — verify live before assuming its exact submenu location.

---

### 2026-09-25 ~00:50 UTC — Phase 2, BRD screen (Corporate Branding) complete: 3/3 green, 2 consecutive clean runs

**Built:**
- `src/pages/admin/CorporateBrandingPage.ts` — Client Logo upload + its error
  message, and the Social Media Images toggle. Route confirmed live:
  `/web/index.php/admin/addTheme`. No Publish/Reset method exists — deliberately
  not built, matching exploration.md §9's "Not recommended" guidance for any
  happy-path Publish/Reset automation against this shared, globally-visible
  screen (a change here is instantly visible to every concurrent user).
- `src/data/fixtures/` — new directory holding the two binary upload fixtures
  these cases need: `e2e_wrongtype.txt` (14 bytes) and `e2e_oversized.png`
  (1,258,292 bytes, matching M4's own oversized-fixture size). Generated once via
  a local Node script, checked in as static files — not created by any test at
  runtime.
- `tests/admin/brd.spec.ts` — all 3 W1 BRD cases (TC_ADM_BRD_001, 002, 006).

**Result:** 3/3 passing on the first attempt, confirmed on a second consecutive
clean run.

**Real findings:**

1. **The CSV's Expected_Result for TC_ADM_BRD_001 is stale.** It still reads the
   original M2 wording ("message 'Attachment Size Exceeded' is displayed"), but
   exploration.md's own BUG-002 entry documents that the M4 milestone re-verified
   this twice and found the symptom had CHANGED: no message of any kind now
   appears — the field just silently shows the filename as if accepted. Before
   writing the test, this was independently re-confirmed live today via the
   browser tool (own repro: uploaded the 14-byte `.txt`, zero error-message
   elements found, filename shown as accepted, browser console still logs "The
   source image cannot be decoded.") — matching the M4 correction exactly, not the
   CSV's older text. Asserted the current actual behaviour per CLAUDE.md §6.4.
   TC_ADM_BRD_002 (oversized `.png`) was independently re-confirmed to still show
   the verbatim "Attachment Size Exceeded" message — that one case did NOT
   regress.

2. **"Social Media Images" is a toggle switch, not a checkbox** — same
   `.oxd-switch-wrapper` component as Organization > General Information's "Edit"
   control (confirmed via direct DOM inspection: the accessibility tree reports it
   as `checkbox` only because a switch's underlying input is still
   `role=checkbox`). Reused the `OxdToggleSwitch` component added for ORG rather
   than building a second one.

3. **The existing `OxdFileUpload` component (built in Phase 1, never previously
   exercised by a real test) needed no changes** — its "click the 'Browse' text,
   wait for the native filechooser event" approach worked correctly once tested
   for real. A manual diagnostic detour clicking `getByRole('button', {name:
   "Choose File"})` instead of the "Browse" text timed out waiting for the
   filechooser — a different, apparently non-functional element with a similar
   name — confirming `OxdFileUpload`'s original selector choice (not the more
   "obvious" one) was the right one.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Next:** CFG screen (Configuration), per the mandated order. Note: per
exploration.md, Configuration has 8 submenu items (not 7, FIND-005) and several
are marked "Not recommended" for mutation (Social Media Authentication, Register
OAuth Client) — check the W1 CSV rows' specific sub-screens before assuming scope.

---

### 2026-09-25 ~01:05 UTC — Phase 2, CFG screen (Email Configuration, Localization, Modules) complete: 4/4 green, 2 consecutive clean runs

**Built:**
- `src/pages/admin/EmailConfigurationPage.ts` — Sending Method / Authentication
  radio selection, SMTP field accessors, Save. Route confirmed live:
  `/web/index.php/admin/listMailConfiguration`.
- `src/pages/admin/LocalizationPage.ts` — read-only, Date Format dropdown only.
  Route: `/web/index.php/admin/localization`.
- `src/pages/admin/ModulesPage.ts` — read-only, per-module toggle accessor.
  Route: `/web/index.php/admin/viewModules`. No toggle is ever clicked (Article
  VI / the PRD's "very high blast radius" classification, exploration.md §2.7).
- `src/components/OxdCheckbox.ts` — added `isDisabled()` to `OxdToggleSwitch`
  (needed to confirm Admin/Pim Module are locked, not just checked).
- `tests/admin/cfg.spec.ts` — all 4 W1 CFG cases (TC_ADM_CFG_001, 003, 008, 011)
  across the three sub-screens.

**Result:** 4/4 passing on the first attempt, confirmed on a second consecutive
clean run.

**Real findings:**

1. **TC_ADM_CFG_001's screen has a known intermittent bug that shaped the test
   design, not just a locator fix.** exploration.md's BUG-006 (and this project's
   own M4 execution, NEWBUG-BRDCFG-2) document that Email Configuration's
   field-visibility can desync from the actually-selected Sending Method radio on
   load — SMTP-only fields sometimes render visible even when `Sendmail` is the
   checked value. Reproduced clean (synced) on today's own fresh-load check, but
   given the bug's own documented intermittency, the test never trusts the
   pre-interaction visible state — it always explicitly selects `Sendmail` first
   (forcing a resync) before asserting anything, the same mitigation the M4 batch
   used successfully. This is a test-design decision informed by a known defect,
   not a new defect assertion itself (BUG-006/NEWBUG-BRDCFG-2 are already logged).

2. **TC_ADM_CFG_003's M4 execution was blocked by that session's own
   interactive-browser-tool permission classifier** ("Modify Shared Resources"),
   not by any actual product or safety constraint — its own notes say Save was
   expected to fail client-side validation harmlessly. Confirmed live before
   writing this test: clicking Save with SMTP+Authentication=Yes and blank
   required fields fires **zero POST/PUT requests** (verified via a live
   `page.on('request')` listener) and produces exactly the CSV's expected
   "Required" messages under Host/User/Password only (Port confirmed to show no
   error, matching exploration.md's "genuinely optional" finding) — safe to
   automate as a normal Playwright test, which has no such interactive classifier.
   Sending Method is reset back to `Sendmail` at the end of the test regardless.

3. **Modules' per-row toggles are `OxdToggleSwitch`, not checkboxes** — a third
   confirmed instance of this component (after Organization's "Edit" and
   Corporate Branding's "Social Media Images"), via direct DOM inspection
   (`.orangehrm-module-field-row` > `<p>` label + `.oxd-switch-wrapper`).

**Also confirmed, not a change:** the `yyyy-dd-mm` day/month-swapped live-example
date format (CLAUDE.md §5.2's own claim) now independently reproduced on a THIRD
distinct date across this project's M2/M4/M5 milestones (2026-09-20, 2026-09-24,
2026-09-25 respectively) — as solid a confirmation as this project has produced
for any single fact.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Next:** NAV screen (final W1 screen — module-agnostic navigation/session
behaviour per the CSV, not a single Admin sub-screen), per the mandated order.
This is the last screen in Phase 2's build order.

---

### 2026-09-25 ~01:20 UTC — Phase 2, NAV screen (Login / Session / Navigation) complete: 7/7 green, 2 consecutive clean runs — Phase 2 COMPLETE (all 8 screens, 45/45 green together)

**Built:**
- `tests/admin/nav.spec.ts` — all 7 W1 NAV cases (TC_ADM_NAV_001, 002, 005, 007,
  008, 015, 016), spanning Login, Admin sidebar navigation, and Session sub-modules.
  No new page object beyond the already-existing `LoginPage` (Phase 1) and
  `UserManagementPage` (reused only for its inherited `BasePage` navigation
  helpers in TC_ADM_NAV_008).

**Architectural decision:** this file deliberately uses plain `@playwright/test`
(`test`/`expect`/`page`), NOT this project's own `src/fixtures` chain. That chain
authenticates once per WORKER and reuses the resulting `storageState` across every
other test file for efficiency — the wrong tool for cases that test the login form
and logout flow themselves. Logging out through the shared worker session would
invalidate it server-side for every other test reusing that `storageState`
afterward. Each NAV test that needs authentication (008, 015, 016) performs its
own real UI login independently, in Playwright's ordinary fresh per-test context,
never touching the shared worker fixture. Confirmed safe: ran the full 45-test
Phase 2 suite (all 8 spec files) together in one invocation — nav.spec.ts's
logout tests caused no failures anywhere else in the run.

**Result:** 7/7 passing, confirmed on 2 consecutive clean runs, plus a full
8-file/45-test combined run.

**Real findings:**

1. **A genuine timing bug in the TEST itself (not a page object or component):**
   `BasePage.breadcrumbText()` reads the DOM once via `.count()`/`.textContent()`
   calls — it is a plain async helper, not a Playwright locator `expect()` that
   auto-retries. Calling it immediately after a navigation (even after
   `openTopTabSubmenuItem()`'s own `waitForIdle()`) could run before the new
   screen's breadcrumb had actually rendered, returning an empty array — caught
   live (`breadcrumb[0]` was `undefined`, screenshot at the failure moment showed
   a fully blank page mid-transition). Fixed at the call site by waiting for a
   real breadcrumb heading to be visible (a proper auto-retrying `expect()`)
   immediately before calling the plain helper, rather than trusting
   `waitForIdle()` alone — the same class of fix applied repeatedly elsewhere in
   this log, now recognized as a general pattern: any plain (non-`expect`-wrapped)
   DOM-reading helper needs an explicit content-based wait immediately before it
   is called, every time, not just after a click.

2. **The CSV's Expected_Result for TC_ADM_NAV_008 was imprecise, not wrong.** It
   says the breadcrumb "reads Admin" after opening the User Management tab;
   live-confirmed this is actually a two-segment breadcrumb (`["Admin", "User
   Management"]`), not a single-segment one. Interpreted as intended — asserted
   the first segment equals `"Admin"` — rather than asserting a single-segment
   shape that doesn't exist and would never pass.

**Also confirmed, not a change:** `LoginPage` (built in Phase 1, never previously
exercised by a real test) needed zero changes — `goto()`, `login()`,
`submitPartial()`, and `logout()` all worked correctly on first use across all 7
cases.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

---

## Phase 2 summary — all 8 screens complete

| Screen | Tests | Status |
|---|---|---|
| USR (User Management) | 9 | Green |
| JOB (Job Titles) | 6 | Green |
| QUA (Skills) | 7 | Green |
| NAT (Nationalities) | 5 | Green |
| ORG (Organization) | 4 | Green |
| BRD (Corporate Branding) | 3 | Green |
| CFG (Configuration) | 4 | Green |
| NAV (Login/Session/Navigation) | 7 | Green |
| **Total** | **45** | **45/45 green**, confirmed together in one combined run |

Files created this phase: 12 page objects (`src/pages/admin/`), 8 test specs
(`tests/admin/`), 2 new components (`OxdTree`, `OxdToggleSwitch` — added to
`OxdCheckbox.ts`), 2 binary upload fixtures (`src/data/fixtures/`), plus targeted
fixes to `OxdTable`, `OxdAutocomplete`, `OxdDialog`, `OxdDropdown` (indirectly, via
`fieldFactory`), and `fieldFactory.ts` itself, all driven by real failures hit
live and root-caused (never papered over with a blind wait), per every
per-screen entry above.

**Not started:** Phase 3 (`/code-review`, full-suite `/heal` pass, anything
beyond what's already been fixed inline) — explicitly out of scope for this
session per the Phase 2 brief.

---

### 2026-09-25 ~01:40 UTC — Coverage gap found and closed: W1 is 47, not 45 — TC_ADM_JOB_023 and TC_ADM_JOB_049 were never built

**Root cause (my own error, not a legitimate exclusion):** the initial JOB-screen
research query in this session filtered `test_design.csv` for
`TC_ID.startsWith('TC_ADM_JOB') && automation_wave === 'W1'` and returned exactly
6 rows, all Job Titles. That query was correct, but its RESULT was never
cross-checked against the master `automation_wave = W1` count (47) before Phase 2
proceeded screen-by-screen — so the fact that JOB's own W1 set actually has 8 rows
(6 Job Titles + `TC_ADM_JOB_023` Pay Grades + `TC_ADM_JOB_049` Work Shifts) went
unnoticed until the user's own gap-accounting request prompted a full diff. This
is NOT the same category of gap as an environment-permission block (e.g. the M4
execution's `TC_ADM_CFG_003` classifier denial, which was separately re-attempted
and built cleanly as a normal Playwright test earlier in this log, with zero
issues — CFG_003 was never actually missing from W1's automated coverage). Full
diff run: `grep`-derived list of every `TC_ADM_*` id referenced across
`tests/admin/*.spec.ts`, diffed against every `automation_wave = W1` row in the
CSV — confirmed these two were the ONLY gap, and confirmed no built test
references a TC_ID outside the W1 set either.

**Built to close the gap:**
- `src/components/OxdTimePicker.ts` — new component for the Work Shift
  hour/minute/AM-PM picker. Discovered a genuinely NEW variant of the checkbox/
  radio-wrapper trap while building it: for every other radio/checkbox in this
  project, the ICON intercepts the WRAPPER, so the fix is "click the wrapper, not
  the input." Here it is the OPPOSITE — clicking the radio's own `<label>` text
  fails because the raw `<input>` itself intercepts the pointer event (confirmed
  via the exact Playwright retry-log wording). Fixed by clicking the `<input>`
  directly with `force: true` — the reverse of the usual mitigation.
- `src/pages/admin/PayGradesPage.ts` — Add Pay Grade + Currency sub-form.
  Discovered saving a new Pay Grade immediately redirects to its own Edit view
  (unlike Job Titles/Skills/Nationalities, which stay on the list) — a toast wait
  is unreliable there (the route change can unmount it before `waitFor` catches
  it), so `createPayGrade()` uses the resulting page's own "Currencies" heading as
  its success signal instead. Also discovered the Currencies sub-form renders its
  own "Save" button alongside the Pay Grade's own, an unscoped
  `getByRole('button', {name:'Save'})` hits a strict-mode violation.
- `src/pages/admin/WorkShiftsPage.ts` — Add Work Shift + time picker.
- `src/utils/fieldFactory.ts` — added `formContaining(scope, label)` (scopes to
  the `.oxd-form` section containing a given label, to disambiguate multiple
  same-named buttons on one screen — used by both new page objects) and
  `fieldValueText(scope, label)` (a label-anchored READ-ONLY computed value
  rendered as `<p>` text, not an input — used for Work Shifts' "Duration Per
  Day"). Both are generalizations, not one-off hacks: mid-build, a first draft of
  `PayGradesPage` embedded its own inline `.oxd-form`/`label` selector logic
  directly in the page object (a real "raw oxd- selector in a page object"
  violation caught and fixed by moving that logic into `fieldFactory.ts`, the one
  file CLAUDE.md §5.1 permits to reference `.oxd-input-group`/`.oxd-form`
  directly).
- `tests/admin/job.spec.ts` — added `TC_ADM_JOB_023` and `TC_ADM_JOB_049` in two
  new `test.describe` blocks (Pay Grades, Work Shifts) alongside the existing Job
  Titles block.

**Result:** both new cases passed on the FIRST attempt, confirmed on a second
consecutive clean run, then the full Phase 2 suite re-run at its true W1 size —
**47/47 passing together**, one combined invocation, single worker.

**Typecheck:** `npx tsc --noEmit` — 0 errors throughout.

**Final Phase 2 tally:** USR 9, JOB 8 (6 Job Titles + Pay Grades + Work Shifts),
QUA 7, NAT 5, ORG 4, BRD 3, CFG 4, NAV 7 = **47/47**, matching `test_design.csv`'s
`automation_wave = W1` count exactly. `test_design.csv`'s `Automation_ID` column
was cross-checked: every W1 row's `Automation_ID` now corresponds to a real,
passing test; none claims an id that doesn't exist.

---

## Phase 3 — code review, healing, final report

### 2026-09-25 ~02:10 UTC — Step 1 (/code-review) complete: 1 Blocker + 8 Major + 1 Minor found, all Blockers/Majors fixed — verdict APPROVED

Full findings and rationale: `deliverables/05-automation/code_review.md`.

**Findings (ID: severity — one-line):**
- F1: **Blocker** — banned `waitForTimeout(1000)` in `brd.spec.ts:13`. Fixed:
  removed, replaced by reordering the existing content-based assertion.
- F2a-d: Major — raw oxd- selectors outside `src/components/` in
  `EmailConfigurationPage`, `CorporateBrandingPage`, `UserManagementPage` (x2,
  one bundled with dead code). Fixed: new `fieldFactory.radioGroup()` /
  `fileUpload()` exports, exported `labelledContainer()`, new
  `OxdTable.cellTexts()`; dead getters deleted.
- F3: Major — positional `.first()`/`.nth(1)` in `WorkShiftsPage`'s From/To
  lookup. Fixed: live-confirmed real per-field `<label>`s exist; replaced with
  `field(page, 'From')`/`field(page, 'To')`.
- F4: Major — unscoped `getByRole('img', {name:'profile picture'})` in
  `BasePage.openUserMenu()`, `LoginPage.logout()`, `nav.spec.ts` TC_ADM_NAV_001.
  Live-diagnosed NEW finding (not previously known): the Dashboard's Buzz/
  Attendance/Leave widgets can render up to 8 matching images total, only 1 of
  which is the real topbar control. Fixed: scoped all 3 call sites to
  `getByRole('banner')` first (confirmed 1 match).
- F5: Major — literal `expect()` calls inside `BasePage.gotoPath()` and
  `LoginPage.goto()` (page objects must stay assertion-free). Fixed: switched
  to `.waitFor({state:'visible'})`, identical wait behaviour, no `expect` API
  surface.
- F2e: Minor — `LoginPage.requiredFieldErrors` uses a raw selector directly.
  NOT restructured (documented instead) — it counts all visible errors across
  a 2-field form at once, a different contract than `fieldFactory.fieldError`,
  and the screen pre-dates `fieldFactory` with no `.oxd-input-group` wrapper
  to anchor to. Comment added recording the reasoning.

**Verified after fixes:** `npx tsc --noEmit` — 0 errors. Full 47-test suite
re-run (regression check, not one of the official Step 2 runs): 46/47 green;
the 1 failure (`TC_ADM_ORG_007`, `page.goto()` 30s timeout in the untouched
`page.fixture.ts`) confirmed transient via an isolated re-run of
`org.spec.ts` alone immediately after: 4/4 clean, ORG_007 in 6.0s (vs. the
30s timeout). Consistent with this project's own documented shared-demo
network instability (CLAUDE.md §5.3), not a regression from any fix above.

**Verdict: APPROVED.** No Blockers remain. Full detail, checklist walkthrough,
and per-finding rationale in `code_review.md`.

**Next:** Step 2 — three consecutive full 47-test suite runs, strictly
sequential, single worker.

---

### 2026-09-25 ~02:30 UTC — Step 2 (three consecutive full-suite runs) complete: 2/3 clean, 1 flaky test found

Ran `npx playwright test tests/admin --workers=1 --reporter=list` three times,
strictly sequentially (each started only after the previous fully exited), on
the config's default `retries: 1` — deliberately kept ON rather than forced to
0, so Playwright's reporter would explicitly mark any failed-then-passed test
as `flaky` (a distinct status from `ok`), rather than a first-attempt failure
silently disappearing into a plain pass.

| Run | Result | Duration | Retries needed |
|---|---|---|---|
| 1 | 47/47 passed | 8.4m | None |
| 2 | 46 passed, **1 flaky** | 12.6m | `TC_ADM_USR_002` (failed attempt 1, passed attempt 2) |
| 3 | 47/47 passed | 8.6m | None |

**Run 2's `TC_ADM_USR_002` flake is a healing candidate per the binding rule
in this milestone's brief — it is NOT counted as a pass, even though the run
finished green overall.** Failure detail: `TimeoutError: locator.waitFor:
Timeout 15000ms exceeded` waiting for `.oxd-toast-content--success` at
`src/components/OxdToast.ts:25`, inside `UserManagementPage.createUser()`,
called from `usr.spec.ts:107`.

**Also notable, not itself a defect:** run 2 was markedly slower across
almost every test than runs 1 and 3 (e.g. `TC_ADM_QUA_001` 35.2s vs. 11.6s/
13.1s; `TC_ADM_CFG_001` 18.4s vs. 6.6s/6.0s) — consistent with a real,
transient shared-demo slowdown during that run's window, not a change in any
test. Logged here as context for the heal diagnosis below, not as a separate
finding.

**Next:** Step 3 — `/heal` on `TC_ADM_USR_002`.

---

### 2026-09-25 ~02:45 UTC — Step 3 (`/heal`) and Step 4 (`healing_process.md`) complete — Phase 3 and Milestone 5 done, Gate G5 reached

**Step 3:** Read `.claude/commands/heal.md` in full and applied its procedure to
`TC_ADM_USR_002`. Reproduced in isolation 3x (`--workers=1 --retries=0
--trace=on`): 3/3 clean (21.7s / 21.3s / 23.4s), confirming intermittent, not
deterministic failure — the exact distinction `heal.md` step 2 calls for.
Classified **ENV_INSTABILITY**: the failing run showed a uniform ~2–3x
slowdown across entirely unrelated screens (not just this test), the failed
call was the test's first, non-duplicate, fresh-data Save (ruling out
STATE_POLLUTION), and the same toast locator is proven reliable everywhere
else in the suite (ruling out LOCATOR_DRIFT). Per `heal.md`'s own
ENV_INSTABILITY branch: **no code change**, recorded with evidence, not
quarantined (already at minimum workers, reproduces cleanly under normal
load). Full entry: `HEAL-022` in `healing_process.md`.

**Step 4:** Wrote `deliverables/05-automation/healing_process.md` as a full
experiment log covering the WHOLE of Milestone 5 — 22 entries (`HEAL-001`
through `HEAL-022`), including all 10 historical items named in this phase's
brief plus every other genuine diagnosed fix found across Phases 1–3
(JOB/NAT/ORG timing races, the ORG mandatory-Country gap, the OrgTree DOM
mis-mapping, the NAV breadcrumb race, the code-review's `waitForTimeout` and
profile-picture findings, and the official `HEAL-022`). Entries caught
pre-execution (self-review/code-review, never actually run broken) are marked
explicitly as such rather than fabricating a reproduction history. Closed with
a summary table by root-cause class (TIMING 8, LOCATOR_DRIFT 10, TEST_LOGIC 3,
ENV_INSTABILITY 1, STATE_POLLUTION 0, PRODUCT_BUG 0 by design), a quarantined-
tests section (none), and a residual-risk section (shared-demo instability,
environment drift on previously-confirmed selectors, and the two live
unfixed product bugs).

**Final Automation_ID cross-check:** re-verified independently this session
(not just carried over from Phase 2's own check) — every `automation_wave =
W1` row in `test_design.csv` (47 rows) has exactly one corresponding
`TC_ADM_*` test in `tests/admin/*.spec.ts` (47 built), zero missing, zero
extra, confirmed via a direct set-difference script against both files.

**Typecheck:** `npx tsc --noEmit` — 0 errors (unchanged since Step 1; no
source files were modified in Steps 2–4, only test-design/log artifacts).

**Milestone 5, Phase 3 complete. Stopping at Gate G5 per the governing
instruction — no further milestone work without new sign-off.**

---

### 2026-09-26 — Post-G5: 5 P0 cases promoted from Wave 2 to Wave 1 (47 → 52), cascade completed

**Why:** the Priority Model (`test_design_coverage.md` §8) showed a confirmed defect
(`BUG-003`) at P0 with no automated regression guard. The rule "every P0 case is Wave 1"
(§8.5) was added, promoting `TC_ADM_NAV_003`, `TC_ADM_NAV_004`, `TC_ADM_USR_005`,
`TC_ADM_USR_006`, `TC_ADM_USR_007`.

**Built:** 5 tests, no new page-object code. `NAV_003` is a parameter variant of
`NAV_002` (`LoginPage.login()`, verbatim `Invalid credentials` alert). `USR_005/006/007`
are parameter variants of `USR_003` (`submitAddFormWithEmptyField()` was already typed
for `'Status' | 'Username' | 'Password'`), asserting the verbatim `Required` field error,
no success toast, and no record created, with `e2e_` data tracked for teardown.
`NAV_004` asserts BUG-003's **actual** behaviour: `ADMIN` / `admin123` logs in and
reaches the dashboard. It is annotated as a known-defect guard, the same treatment as
`TC_ADM_NAT_010` (BUG-001) and `TC_ADM_BRD_001` (BUG-002).

**Runs (from the work session that was interrupted):**
- Report-build run (JSON + step reporters, workers 1, started 2026-09-25T22:15:06Z,
  477.0 s): **52/52 passed, 0 retries**. `automation_execution_report.html` was rebuilt
  from this run. The assembly script aborts unless exactly 52 results join to W1 rows.
- A separate full-suite run (launched 2026-09-25T21:52:04Z, 10.2 min): 51 clean, 1 flaky (`TC_ADM_USR_022`, passed on its automatic
  retry). This was diagnosed as ENV_INSTABILITY in `HEAL-027` (3/3 clean in isolation,
  and an unrelated navigation check failed in the same window). There was no code change.
- All 5 promoted tests passed on the first attempt in both runs.
- The report-build run's raw JSON was not kept; the embedded data in the report is its
  surviving record. The flaky run's raw list output did survive and is retained at
  `deliverables/05-automation/runs/2026-09-25T2152Z_full-suite_list.txt`.

**Cascade completed this session (resumed after a rate-limit interruption):** checked on
disk first. The tests, the CSV promotion, the run, `HEAL-027` and the report rebuild were
already done and were not redone. Still-stale figures were then updated to 52 / 84 in:
`implementation_summary.xlsx`, `plan.md`, `tasks.md` (plus heal count 25 → 27),
`ci_cd.md` and `solution_flow.html`. `HEAL-027`'s own text said the two ENV_INSTABILITY
incidents were "months apart"; they are about 19 hours apart (both 2026-09-25), and that was corrected. Historical
47-test records (Phase 2/3 runs, `code_review.md`, `prompts_used.md`, the
pre-promotion narrative in `test_design_coverage.md`) were left as written, because
they accurately describe what happened at the time.

**Checks done this session:** `npx playwright test --list` lists 52 tests.
`test_design.csv` has W1 = 52, W2 = 84, and all 17 P0 rows are W1 (0 exceptions). The
5 promoted rows have `automation_wave = W1` and `Automation_ID` equal to their `TC_ID`.

---

### 2026-09-26 16:00–16:45 UTC — HEAL-027 timestamp resolved; 3 violation classes fixed; full re-review; retained 52-test run

**1. HEAL-027's timestamp.** The header said "2026-09-26 ~10:15 UTC", which matched no
recorded run. Evidence was found for the real run: the interrupted session's transcript
records the launch at 2026-09-25T21:52:04Z (`npx playwright test tests/admin --workers=1
--reporter=list`) and the result read back at 22:02:27Z ("1 flaky … 51 passed (10.2m)").
The entry itself was written at 22:05:14Z. That run's raw list output survived in the old
session's task folder and is now committed at
`deliverables/05-automation/runs/2026-09-25T2152Z_full-suite_list.txt`. HEAL-027 was
corrected to "2026-09-25 21:52–22:02 UTC", with a timestamp note citing both sources.
This also showed that HEAL-022 and HEAL-027 are about 19 hours apart on the same day, not
a day apart; that wording was corrected too.

**2. Violations found by a full search, not only in the spots first reported.**
- Raw oxd- selectors in test files: 17 lines across `usr`, `job`, `qua`, `org` and `nat`
  specs, plus one in `LoginPage.ts`. Fixed with `OxdToast.successToastCount()`,
  `fieldFactory.allFieldErrors()`, new `src/pages/pim/EmployeeListPage.ts` and
  `PersonalDetailsPage.ts`, and a header-based `OxdTable.cell()` / `columnTexts()`.
- Weak `toastText.length > 0` assertions: 5 (USR_020, USR_022, JOB_008, QUA_008,
  NAT_010). Fixed by observing the delete toasts live and asserting them verbatim.
- `.isVisible().catch(() => false)`: 5 (3 in `OxdTable`, 2 in `usr.spec.ts`). Replaced
  with count-based `isEmpty()` / `hasPagination()` / `pageNumbers()`, after live checks
  confirmed both elements are detached, not hidden, when absent.
- Found by the re-review: `OxdTable.row()` used substring `hasText` plus `.first()`.
  It now matches a whole cell exactly, with no `.first()`.

**Delete toast, observed live 2026-09-26 16:14–16:17Z** (self-created `e2e_m5toast_*`
records, one browser, UI login). Every flow shows title `Success` and message
**`Successfully Deleted`**. That covers User Management single delete, User Management
bulk delete of 2 (one toast, same wording, not pluralised), Job Titles, Skills and
Nationalities. Recorded in exploration.md Addendum A (marked M5-sourced) with 3
screenshots. The Expected_Result cells for USR_020, USR_022, JOB_008, QUA_008 and
NAT_010 in `test_design.csv` now quote it.

**3. `/code-review` re-run in full.** 2 Blockers and 5 Majors were fixed. 3 Minors are
left open with stated conditions: `OxdTree` `.first()` (needs live DOM verification
before changing), `.first()` after exact labels in `fieldFactory` / `OxdCheckbox`, and a
raw readiness wait at `nav.spec.ts:115`. Verdict: APPROVED WITH MINORS
(`code_review.md`, re-review section). `npx tsc --noEmit`: 0 errors. A targeted run of
the 15 tests on changed code paths passed 15/15 with 0 retries.

**4. Official full-suite run, output retained.** Launched 2026-09-26T16:28:24Z with
`--workers=1` and the configured retries (1). Record:
`deliverables/05-automation/runs/2026-09-26_full-suite/` (`list-output.txt`,
`playwright-run.json`, `playwright-steps.json`, and both failure screenshots).
- **Result: 52/52 passed. 50 passed on the first attempt and 2 were flaky, 0 failed,
  636.7 s.**
- `TC_ADM_QUA_010` and `TC_ADM_USR_001` failed their first attempts back-to-back
  (16:33:01Z, 16:33:57Z), both with `page.goto: Timeout 30000ms exceeded` in the shared
  page fixture's dashboard navigation, before any test code ran. Both screenshots are
  blank pages. Both passed on retry.
- `/heal`: each reproduced 3/3 clean in isolation (`--retries=0 --trace=on`).
  Classified ENV_INSTABILITY with no code change: `HEAL-028` and `HEAL-029`. Raising the
  navigation timeout was considered and rejected as timeout inflation without a
  readiness signal.
- None of the tests touched by today's changes failed in the run.

**5. Report rebuilt** from that retained run (`automation_execution_report.html`: data
object swapped, template unchanged). It shows 52 executed, 50 Pass, 2 Flaky, 0 Fail,
with healing ENV_INSTABILITY = 4. Rendered offline in headless Chromium with 0 console
errors.

---
