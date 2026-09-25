# Healing Process — Experiment Log

**Scope:** every diagnosed test/build failure across the whole of Milestone 5
(Phases 1–3), not only the official Phase 3 `/heal` pass. Phase 1/2 entries
were originally recorded only in `PROGRESS.md`; they are reproduced here in
full `heal.md` format, honestly distinguishing failures that were caught
**live** (a test actually ran and failed, reproduced, then fixed) from ones
caught **pre-execution** (self-review or `/code-review` found a real defect
before it ever ran against the suite — no reproduction history exists for
these because none was possible; marked explicitly below, never fabricated).

Format per entry, per `.claude/commands/heal.md` §6.

---

### HEAL-001 | 2026-09-24 ~12:35 UTC
Test:            Phase 1 smoke test (worker auth fixture → page fixture → assert sidebar visible)
Symptom:         Post-login readiness wait times out intermittently on a cold load
Raw error:       `expect(spinner).toHaveCount(0)` — resolved 6/5/4/3/2/1 elements across the 10s global `expect.timeout` window, never reaching 0 in time
Attempts:        1 fail (first live run) → reproduced the cause by re-checking spinner count ~8s later (0, confirmed) → 1 clean pass after fix (fresh worker, `retries: 0`, 19.6s)
Hypothesis:      Dashboard renders several independent widgets, each with its own loader; on a cold load 1–2 can still be resolving past the default 10s window
Root cause:      TIMING — confirmed by direct re-check: the spinner count genuinely reaches 0, just later than 10s; not a stuck/broken spinner, not a locator error (spinner resolved correctly every time, only the timeout was too short for this specific multi-widget page)
Fix layer:       util (`src/utils/fieldFactory.ts`, `waitForIdle()`)
Change:          `waitForIdle()` gained an explicit `timeoutMs` parameter, default raised 10,000ms → 20,000ms — still a conditional element-state assertion (spinner count 0), never a blind sleep; the *timeout* on an existing correct wait was escalated, not the wait replaced with one
Verification:    1/1 clean on fresh worker post-fix (19.6s); reconfirmed stable across every subsequent Phase 1–3 run (no further spinner timeouts logged anywhere in this project)
Prevention rule: Any shared readiness wait covering a multi-widget page gets a named, documented timeout override point (a parameter), not a silently-doubled global default

---

### HEAL-002 | 2026-09-24 ~12:35 UTC (caught pre-execution — self-review, never run)
Test:            N/A — caught before `BasePage.openUserMenu()` was ever exercised by a test
Symptom:         Drafted locator used guessed class names never actually observed in the live DOM
Raw error:       N/A — no test ever ran against this version; caught in self-review before Phase 1 shipped
Attempts:        N/A (see above)
Hypothesis:      `.oxd-userdropdown-tab` / `.oxd-topbar-header-userarea` were plausible-looking but invented class names, not confirmed against real HTML
Root cause:      LOCATOR_DRIFT (pre-emptive) — the selector was never drifted from a real DOM, it was never grounded in one to begin with; classified here because the defect class is identical to a locator that has drifted (would resolve to 0 nodes)
Fix layer:       page (`src/pages/base/BasePage.ts`)
Change:          Replaced with `getByRole('img', { name: 'profile picture' })` — confirmed present via alt text in every M2/M4 topbar snapshot on file, and independently immune to the topbar's linked employee display name drifting mid-project
Verification:    N/A — no broken version ever ran; correct version verified working across every Phase 1–3 test that logs in (later itself required a further fix, see HEAL-021)
Prevention rule: No locator ships without being confirmed against a real DOM snapshot or accessibility tree first — zero-invention discipline, held for the rest of the project

---

### HEAL-003 | 2026-09-24 ~12:35 UTC (caught pre-execution — self-review, never run)
Test:            N/A — caught before `BasePage.breadcrumbText()` was ever exercised by a test
Symptom:         Initial locator would also match each screen's own main-content title heading, not only the real breadcrumb
Raw error:       N/A — self-review, not a live failure
Attempts:        N/A
Hypothesis:      `page.getByRole('heading', {level:6})`, unscoped, matches more than the intended element because the main-content title is ALSO rendered as a level-6 heading
Root cause:      LOCATOR_DRIFT (pre-emptive, strict-mode-violation shape) — would resolve to 2+ nodes, the exact LOCATOR_DRIFT signature, just caught before it ever executed
Fix layer:       page (`src/pages/base/BasePage.ts`)
Change:          Scoped to `getByRole('banner')` first, resolving to exactly the topbar's own breadcrumb heading
Verification:    N/A — no broken version ever ran; correct version verified across every navigation-asserting test in Phase 2/NAV (later needed the additional fix in HEAL-019 for a separate, unrelated timing gap)
Prevention rule: Any locator targeting "the" heading/label/button on a page must be scoped to a specific landmark first, never left to match anywhere in the document

---

### HEAL-004 | 2026-09-24 ~12:35 UTC (caught pre-execution — self-review, never shipped)
Test:            N/A — `OxdFileUpload.selectedFileName`, drafted then removed before any test used it
Symptom:         Draft locator used a positional XPath axis
Raw error:       N/A — never shipped, never run
Attempts:        N/A
Hypothesis:      `following-sibling::*[1]` was a quick guess at "the element right after the input" with no live confirmation
Root cause:      LOCATOR_DRIFT (policy violation) — CLAUDE.md §5.1 forbids positional XPath outright; caught in self-review, not live
Fix layer:       component (`src/components/OxdFileUpload.ts`)
Change:          Getter removed entirely rather than shipped in a non-compliant form; no W1 case needed it. A comment was left for whoever adds it later to use a real observed selector
Verification:    N/A — never shipped
Prevention rule: A draft locator that can't be confirmed against a live DOM inside the same session is deleted, not shipped "to fix later"

---

### HEAL-005 | 2026-09-24 ~20:20 UTC
Test:            All Phase 2 USR cases (surfaced first on the Add User form build)
Symptom:         `labelledContainer()` never matched any field on the Add User form
Raw error:       Locator resolved to 0 nodes / wrong node (strict-mode candidate) when filtering the container by `hasText` against an anchored `^label$` regex
Attempts:        Failed on first live attempt against the Add User form; reproduced the cause via direct `textContent()` inspection (concatenated label+control text, no newline); 1 clean pass after fix, confirmed on 2 further consecutive USR suite runs
Hypothesis:      The container's full `textContent` concatenates the label with its sibling control's own rendered text (e.g. `"User Role-- Select --"`), so an anchored regex against the whole container can never match; the required-field `*` is a CSS `::after`, never real DOM text; `.oxd-form-row` also wraps the entire 4-field section, not one field, so including it in the union let an unscoped `.first()` grab a too-broad row
Root cause:      LOCATOR_DRIFT — confirmed via direct DOM inspection: the assumed shape (container's own text == label text) was wrong for this form's real markup
Fix layer:       util (`src/utils/fieldFactory.ts`, `labelledContainer()`)
Change:          Rescoped to match a `<label>` **descendant's** own exact text, inside `.oxd-input-group` only (CLAUDE.md §5.1's own worked example) — confirmed live to resolve to exactly one match on both the Add form and the search panel
Verification:    3 consecutive clean USR suite runs post-fix (9/9 each)
Prevention rule: Label-anchored lookups match a `<label>` descendant's own text specifically, never a container's aggregate `textContent`

---

### HEAL-006 | 2026-09-24 ~20:20 UTC
Test:            Phase 2 USR cases using `OxdAutocomplete` (Employee Name field)
Symptom:         Autocomplete field could silently end up "Invalid" with no exception raised anywhere
Raw error:       No thrown error — silent: `selectFirstSuggestion()` returned normally having clicked a non-selectable placeholder, form validation later reported "Invalid" with no traceable cause
Attempts:        Intermittent under real debounce timing; reproduced by watching the dropdown's own transient states live (No Records Found → "Searching…." placeholder → real results); 1 clean pass after fix, confirmed on subsequent USR runs
Hypothesis:      Between "No Records Found" and real results, the dropdown briefly renders a THIRD state — literally the text `"Searching...."` — while the debounced request is in flight; the original exclusion list only filtered "No Records Found"
Root cause:      TIMING — element exists (the placeholder), and the code clicked it because a genuine intermediate loading state wasn't accounted for, not because a selector was structurally wrong
Fix layer:       component (`src/components/OxdAutocomplete.ts`)
Change:          `selectFirstSuggestion()` now also excludes the `"Searching...."` placeholder and reads the input's actual applied value AFTER the click (not a pre-click `textContent()` read) to confirm a real option was applied
Verification:    3 consecutive clean USR suite runs post-fix
Prevention rule: Any debounced/async suggestion list gets every transient placeholder state enumerated and excluded, not just the empty-result one

---

### HEAL-007 | 2026-09-24 ~20:20 UTC
Test:            TC_ADM_USR_013 (row count), TC_ADM_USR_024 (row action-icon order)
Symptom:         Row count assertions off-by-one; a first-row check could receive the header row instead
Raw error:       Count assertion mismatch (expected N, got N+1) traced to `.oxd-table-row` matching the header
Attempts:        Failed live on first USR_013 run; reproduced via direct DOM inspection confirming both header and data rows share the class; 1 clean pass after fix, confirmed on subsequent runs
Hypothesis:      `.oxd-table` has exactly two children, `.oxd-table-header` and `.oxd-table-body`, and BOTH the header row and every data row render as `<div class="oxd-table-row">`
Root cause:      LOCATOR_DRIFT — an unscoped `.oxd-table-row` query structurally includes a node it should never include
Fix layer:       component (`src/components/OxdTable.ts`)
Change:          New `rows` getter scoped to `.oxd-table-body .oxd-table-row`, excluding the header row entirely
Verification:    3 consecutive clean USR suite runs post-fix; re-confirmed correct on every subsequent screen's table (JOB, QUA, NAT)
Prevention rule: Any oxd table row lookup is scoped to `.oxd-table-body`, never the bare `.oxd-table`/`.oxd-table-row` class alone

---

### HEAL-008 | 2026-09-24 ~20:20 UTC
Test:            Phase 2 USR cases using the Add button, the delete-confirm dialog, and the bulk-delete toolbar
Symptom:         `exact: true` accessible-name matches failed to resolve
Raw error:       Locator resolved to 0 nodes when matching `{ name: 'Add', exact: true }` and equivalents
Attempts:        Failed live; reproduced via `dialog.ariaSnapshot()`, which showed the true accessible names; 1 clean pass after fix
Hypothesis:      An icon glyph inside these specific buttons contributes an extra leading/trailing character or space to the computed accessible name
Root cause:      LOCATOR_DRIFT — confirmed via `ariaSnapshot()`: real names are `" Add"`, `" Yes, Delete"`, `" Delete Selected "` — not the clean strings assumed
Fix layer:       page (per-button getters in the affected page objects)
Change:          Dropped `exact: true` on these three buttons specifically (substring match); `Save`/`Cancel`/`Search`/`Reset` were independently confirmed clean and left unchanged
Verification:    3 consecutive clean USR suite runs post-fix
Prevention rule: Never assume `exact: true` is safe on a button containing an icon without confirming its real accessible name via `ariaSnapshot()` first

---

### HEAL-009 | 2026-09-24 ~20:20 UTC
Test:            Phase 2 USR cases asserting empty-state / record-count (e.g. TC_ADM_USR_013)
Symptom:         Empty-state / record-count assertions matched the wrong element, including a transient toast
Raw error:       Assertion matched more than one element / matched stale toast text instead of the persistent table-area state
Attempts:        Failed live; reproduced via direct DOM inspection showing both elements are siblings of `.oxd-table`, not descendants of it, under a shared `.orangehrm-paper-container`; a zero-result search also independently pops an info toast with identical "No Records Found" text outside that container; 1 clean pass after fix
Hypothesis:      `emptyState`/`recordCountHeader` were scoped to `.oxd-table`, which structurally does not contain either element
Root cause:      LOCATOR_DRIFT — wrong container assumed for these two states
Fix layer:       component (`src/components/OxdTable.ts`)
Change:          New `listContainer` (`.orangehrm-paper-container`) scope, which includes both real states but excludes the toast
Verification:    3 consecutive clean USR suite runs post-fix
Prevention rule: Confirm an element's real DOM ancestor via inspection before scoping to an assumed "obvious" parent

---

### HEAL-010 | 2026-09-24 ~20:20 UTC
Test:            Phase 2 USR cases performing a search/reset then immediately reading the table
Symptom:         Table read immediately after a search click could return stale (pre-update) data
Raw error:       `allRowValues()` returned a row list not yet containing the just-edited/just-searched-for record; `waitForIdle()`'s spinner-gone check trivially passed
Attempts:        Failed intermittently live; reproduced by observing the spinner-gone check resolve to true before a fresh request had even mounted its own spinner; 1 clean pass after fix, confirmed on subsequent runs
Hypothesis:      A spinner-gone check that only asserts the CURRENT count is 0 can pass in the narrow window between a click and the new request adding its own spinner
Root cause:      TIMING — a real race between the click and the spinner's own mount, not a structural locator issue
Fix layer:       component (`src/components/OxdTable.ts`, `clickSearch()`/`clickReset()`)
Change:          Both now wait for either the record-count header or the empty state to actually render (content-based), instead of trusting the spinner-gone check alone; `waitForIdle()` remains a supplementary settle-check, not the sole signal
Verification:    3 consecutive clean USR suite runs post-fix
Prevention rule: A "spinner gone" check is never trusted as a sole post-click readiness signal when a content-based alternative exists

---

### HEAL-011 | 2026-09-24 ~20:20 UTC
Test:            TC_ADM_USR_022 (bulk delete via row checkboxes)
Symptom:         Original test design (filter by a shared substring to show two new records at once) could never work
Raw error:       Search returned "No Records Found" against a true prefix of a real, live username
Attempts:        Failed live against the original design; reproduced directly by searching a confirmed-existing username's own prefix; redesigned test passed on first attempt post-fix, confirmed on 2 further runs
Hypothesis:      The Username search filter was assumed to be a substring/contains match, matching typical list-filter UX
Root cause:      TEST_LOGIC — the test's own expectation about the app's search semantics was wrong; confirmed directly (exact match only) rather than assumed
Fix layer:       test (`tests/admin/usr.spec.ts`) + page (`UserManagementPage`, new `goToPageContaining()` helper)
Change:          Redesigned around the confirmed real behavior: the unfiltered list sorts alphabetically (confirmed live), so two `e2e_<domain>_<...>` users created back to back share a literal prefix and land on the same unfiltered page; `goToPageContaining()` walks the unfiltered, paginated list to find it. Post-delete verification checks each specific username individually rather than an unfiltered total-count delta (which would be vulnerable to concurrent real users on this shared demo)
Verification:    3 consecutive clean USR suite runs post-fix
Prevention rule: Never assume a filter's match semantics (substring vs. exact) without confirming live; TEST_LOGIC fixes correct the test against confirmed real behavior, never paper over it

---

### HEAL-012 | 2026-09-24 ~20:35 UTC
Test:            TC_ADM_JOB_006 (edit an existing Job Titles record, verified by reading the list)
Symptom:         Table read on a screen's very first navigation (no search panel involved) could race the initial data fetch
Raw error:       Row data read before the true first render completed, same signature as HEAL-010 but on a bare `goto()` with no search click at all
Attempts:        Failed live on first JOB_006 run; reproduced by confirming (via screenshot) the header count was already correct while row content still raced; 1 clean pass after fix
Hypothesis:      The "spinner-gone can resolve before mount" race from HEAL-010 is not specific to search — it applies to any first navigation into a list screen
Root cause:      TIMING — same underlying race as HEAL-010, different trigger (initial `goto()` vs. a search click)
Fix layer:       component (`src/components/OxdTable.ts`, generalized `waitForListRendered()`, renamed from a USR-only private helper)
Change:          Made the render-wait public and called it from both `JobTitlesPage.goto()` and `UserManagementPage.goto()` (the latter for consistency/future-proofing)
Verification:    2 consecutive clean JOB suite runs; USR re-run after the shared-file change — still 9/9
Prevention rule: A race diagnosed on one trigger (search) is checked against every other trigger (navigation) that shares the same underlying read, not assumed to be search-specific

---

### HEAL-013 | 2026-09-24 ~20:35 UTC
Test:            TC_ADM_JOB_006 (edit form specifically)
Symptom:         Edit form field filled with a new value before the old value had actually loaded
Raw error:       `jobTitleField().fill(newTitle)` ran against a field that hadn't yet received the record's real data
Attempts:        Reproduced by hand-pacing the exact flow twice via the browser tool (succeeded every time, ruling out an app bug) while the automated test's tighter timing hit it reproducibly; 1 clean pass after fix
Hypothesis:      `waitForIdle()` can resolve before the edit form has hydrated with the record's actual data — a second, distinct instance of the same general race class as HEAL-010/012, this time on form hydration rather than list rendering
Root cause:      TIMING — confirmed by manual reproduction ruling out a product bug; purely an automation-timing gap
Fix layer:       util (`src/utils/fieldFactory.ts`, new `waitForFieldPopulated()`) — not the page object, which CLAUDE.md keeps assertion-free
Change:          New general-purpose utility waits for a label-anchored field to hold a non-empty value before the test proceeds to overwrite it. Applied to `JobTitlesPage.openEditByTitle()`; not retrofitted onto `UserManagementPage.openEditByUsername()` since USR had run clean on 3 consecutive suites — noted as a candidate if it's ever observed to flake there
Verification:    2 consecutive clean JOB suite runs post-fix
Prevention rule: Any edit-form flow that fills over a pre-populated field waits for that field to actually hold data first, not just for the page's generic idle state

---

### HEAL-014 | 2026-09-25 ~00:15 UTC
Test:            TC_ADM_NAT_010 (BUG-001 cross-module verification, via PIM Personal Details)
Symptom:         A content-based "wait for the field to appear" check could still resolve during the wrong window
Raw error:       Screenshot at the moment of failure showed the form area still empty/spinning even after the "field visible" check had already passed
Attempts:        Failed live; reproduced by observing an actual optimistic/partial render flicker (field briefly visible, then disappears again before real data arrives) — a stronger race than any prior entry, since even a content-based check could be fooled; fixed by switching to a network-level signal; 1 clean pass, confirmed on subsequent NAT runs
Hypothesis:      A simple "field visible" wait isn't sufficient when the page itself renders an intermediate, later-discarded state
Root cause:      TIMING — confirmed via the browser's own network log: the real data-loading call (`GET .../pim/employees/{id}/personal-details`) was still in flight during the false-positive "visible" window
Fix layer:       page (`NationalitiesPage`'s cross-module PIM step)
Change:          Switched to a pre-armed `page.waitForResponse()` for that specific endpoint — a precise, deterministic signal, not the banned `networkidle` heuristic (which polls all traffic including analytics) — armed before both the direct-URL navigation and the list-row click that leads to it
Verification:    2 consecutive clean NAT suite runs post-fix
Prevention rule: When a content-based visibility wait is caught passing during a discarded intermediate render, escalate to a specific network-response wait, never to a broader heuristic like `networkidle`

---

### HEAL-015 | 2026-09-25 ~00:15 UTC
Test:            TC_ADM_NAT_010 (PIM Personal Details Save step)
Symptom:         Verification reload could run before the save's async request actually completed
Raw error:       Reproducible silent-persistence failure — reload happened before the save committed, so the reload read stale data
Attempts:        Failed live; reproduced by confirming this Save action does show a `.oxd-toast-content--success` toast that a naive `waitForIdle()`-only flow could race past; 1 clean pass after pre-arming the wait
Hypothesis:      Trusting `waitForIdle()` alone after Save, without pre-arming a wait for the toast, carries the same silent-persistence risk documented for other screens' save flows
Root cause:      TIMING — same general toast-race class as every other save flow in this project, first time observed on this specific cross-module PIM step
Fix layer:       page (`NationalitiesPage`'s cross-module PIM step)
Change:          Pre-armed the success-toast wait (`Promise.all`) before the Save click, rather than trusting `waitForIdle()` alone
Verification:    2 consecutive clean NAT suite runs post-fix
Prevention rule: Every Save action anywhere in the suite pre-arms its toast wait before the triggering click — no exceptions, including cross-module steps outside the Admin page objects proper

---

### HEAL-016 | 2026-09-25 ~00:35 UTC
Test:            TC_ADM_ORG_006 (create a Locations record)
Symptom:         Save silently blocked, no toast ever appeared
Raw error:       A "Required" field error under Country, not surfaced by the original test's assertions
Attempts:        Failed live on first ORG_006 attempt; reproduced via a stalled-save screenshot showing the Required error; 1 clean pass after fix
Hypothesis:      The CSV's Test_Data for this case names only `Name=e2e_<screen>_<ts>`; Country was assumed optional
Root cause:      TEST_LOGIC — the test's own data was incomplete relative to the form's real mandatory-field set, confirmed live rather than assumed from the CSV alone
Fix layer:       page (`LocationsPage.createLocation()`)
Change:          Now always selects a Country (default `United States`, overridable) in addition to Name
Verification:    2 consecutive clean ORG suite runs post-fix
Prevention rule: A CSV's listed Test_Data is a starting point, not a guarantee of completeness — every mandatory field on the real form is confirmed live before a create flow is considered done

---

### HEAL-017 | 2026-09-25 ~00:35 UTC
Test:            TC_ADM_ORG_019 (lazy-loaded child nodes expand on demand, Structure)
Symptom:         Expand-toggle lookups timed out
Raw error:       `.oxd-tree-node-content`-scoped button lookup found zero `<button>` elements
Attempts:        Failed live on first attempt against the accessibility-tree-derived draft; reproduced via direct DOM inspection; 1 clean pass after rescoping
Hypothesis:      The accessibility snapshot presented the expand button as if inside the same wrapper as the node's label, so the first draft scoped to `.oxd-tree-node-content`
Root cause:      LOCATOR_DRIFT — direct DOM inspection showed the button actually lives in a SIBLING `<span class="oxd-tree-node-toggle">`, one level up in `.oxd-tree-node-wrapper`; the accessibility tree's shape did not match the real DOM structure
Fix layer:       component (`src/components/OxdTree.ts`)
Change:          Rescoped `expandToggle()` to `.oxd-tree-node-wrapper` instead of `.oxd-tree-node-content`
Verification:    2 consecutive clean ORG suite runs post-fix
Prevention rule: An accessibility-tree snapshot's implied nesting is a hint, not a substitute for confirming real DOM structure before scoping a component's locators

---

### HEAL-018 | 2026-09-25 ~01:40 UTC
Test:            TC_ADM_JOB_049 (overnight Work Shift time ordering is rejected)
Symptom:         Clicking a time-picker radio's own `<label>` text failed
Raw error:       Playwright retry log: the raw `<input>` intercepts its own label's pointer event (opposite of the standard checkbox/radio wrapper trap used everywhere else in this project)
Attempts:        Failed live while building the new `OxdTimePicker` component; reproduced via the exact retry-log wording confirming which element intercepted the click; 1 clean pass after switching the click target
Hypothesis:      Given every other radio/checkbox trap in this project is "the icon intercepts the wrapper, click the wrapper instead," the same fix was tried first here and failed
Root cause:      LOCATOR_DRIFT (component-specific interaction trap) — confirmed this widget's DOM genuinely behaves opposite to every other oxd radio/checkbox observed so far, not a misapplied general rule
Fix layer:       component (`src/components/OxdTimePicker.ts`)
Change:          Clicks the AM/PM radio `<input>` directly with `force: true` — the deliberate, documented exception to this project's usual "never force through an interception" posture, because here the interception IS the input intercepting its own label, not an overlay masking a real target; recorded in-code with the reasoning so a future reader doesn't mistake it for a shortcut
Verification:    2 consecutive clean runs of the new JOB_049 case, then the full Phase 2 suite at 47/47
Prevention rule: A wrapper-click fix that fails with an interception error naming the INPUT (not an icon/overlay) as the intercepting element is evidence of the inverted variant of this trap, not a reason to add `force: true` reflexively elsewhere

---

### HEAL-019 | 2026-09-25 ~01:20 UTC
Test:            TC_ADM_NAV_008 (Admin top-tab "User Management" navigates to System Users)
Symptom:         `breadcrumbText()` read an empty array
Raw error:       `breadcrumb[0]` was `undefined`; screenshot at the failure moment showed a fully blank page mid-transition
Attempts:        Failed live; reproduced by confirming `breadcrumbText()` is a plain async DOM read (`.count()`/`.textContent()`), not an auto-retrying Playwright `expect()`; 1 clean pass after adding an explicit pre-wait, confirmed on 1 further run and the combined 45-test Phase 2 run
Hypothesis:      Even after `openTopTabSubmenuItem()`'s own `waitForIdle()`, a plain DOM-reading helper can still run before the new screen's breadcrumb has rendered
Root cause:      TIMING — the same general race class as HEAL-010/012/013, this time affecting a non-`expect()` helper specifically
Fix layer:       test (`tests/admin/nav.spec.ts`, call site)
Change:          Waits for a real breadcrumb heading to be visible (a proper auto-retrying `expect()`) immediately before calling the plain helper, rather than trusting `waitForIdle()` alone
Verification:    2 consecutive clean NAV suite runs, plus a full 45-test combined Phase 2 run
Prevention rule: Any plain (non-`expect`-wrapped) DOM-reading helper gets an explicit content-based wait immediately before it is called, every time — recognized here as a general pattern applying beyond this one call site

---

### HEAL-020 | 2026-09-25 ~02:10 UTC (caught via `/code-review`, not a live test failure)
Test:            TC_ADM_BRD_001 (upload of an unsupported file type — KNOWN DEFECT BUG-002)
Symptom:         A banned `waitForTimeout(1000)` sat between the upload action and the assertions
Raw error:       N/A — this is a policy violation, not a runtime error; the test was passing with this line present (confirmed: 46/46-passing runs throughout Phase 2 all included it)
Attempts:        N/A — `/code-review` static finding, not a reproduced failure; the line was removed and the test re-run, passing cleanly (4.7s–11.2s across the three official Step 2 runs)
Hypothesis:      N/A
Root cause:      TEST_LOGIC (policy) — CLAUDE.md explicitly bans `waitForTimeout` regardless of whether it happens to work; a real content-based signal (the already-present `clientLogoFilenameText()` assertion) was available and simply sequenced after the sleep instead of used as the wait itself
Fix layer:       test (`tests/admin/brd.spec.ts`)
Change:          Removed the `waitForTimeout(1000)`; reordered so `clientLogoFilenameText()`'s own auto-retrying assertion runs first and serves as the readiness signal, before the `clientLogoError()` count check
Verification:    Passed on all three official Step 2 full-suite runs (4.7s / 4.9s / 6.5s for this specific test across the three runs) — no regression from removing the sleep
Prevention rule: A passing test is not evidence a banned pattern is safe to keep — `/code-review` checks the pattern itself, not just current green status

---

### HEAL-021 | 2026-09-25 ~02:10 UTC (caught via `/code-review`, live-diagnosed defect-in-waiting)
Test:            `BasePage.openUserMenu()`, `LoginPage.logout()`, TC_ADM_NAV_001 (unscoped `getByRole('img', {name:'profile picture'})`, all three call sites)
Symptom:         A selector confirmed correct in Phase 1 (HEAL-002) had since become ambiguous
Raw error:       N/A as a live test failure (every affected test had been passing — favorable load timing so far); confirmed live via direct DOM inspection during `/code-review`: `document.querySelectorAll('img[alt="profile picture"]')` returned 8 matches on one real Dashboard load
Attempts:        N/A — no test had yet failed from this; found by live inspection, not by reproducing a failure. Fix verified via: 8-match unscoped count → 1-match count after scoping, confirmed live before applying to code
Hypothesis:      The Dashboard's Buzz feed, Attendance, and Leave widgets can each independently render their own `alt="profile picture"` image (post authors' avatars, the viewer's own photo in an attendance/leave card), none of which existed — or at least weren't populated — when HEAL-002 first confirmed this selector in Phase 1
Root cause:      LOCATOR_DRIFT — environment drift specifically: the live app's own content grew new elements matching a selector that was correct when first confirmed; this is real drift, not an error in the original diagnosis
Fix layer:       page (`BasePage.ts`, `LoginPage.ts`) + test (`nav.spec.ts`)
Change:          All three call sites scoped to `getByRole('banner')` first (confirmed to resolve to exactly 1 match), mirroring the same fix pattern already used for `breadcrumbText()` (HEAL-003)
Verification:    Full 47-test suite re-run after the fix: 46/47 (1 unrelated transient failure, see the Step 2 log); every login/logout-touching test passed
Prevention rule: A selector confirmed correct once against a live demo is not assumed correct permanently — a shared, actively-used demo's own content can grow new matches for an existing selector over the life of a project; re-confirm during any later review, don't just trust the original confirmation

---

### HEAL-022 | 2026-09-25 ~02:30 UTC (official Step 2/3 `/heal` cycle)
Test:            TC_ADM_USR_002 (username uniqueness is enforced)
Symptom:         First attempt of an official Step 2 full-suite run timed out waiting for the post-save success toast; passed on Playwright's own automatic retry
Raw error:       `TimeoutError: locator.waitFor: Timeout 15000ms exceeded` — `waiting for locator('.oxd-toast-content--success') to be visible`, at `src/components/OxdToast.ts:25`, inside `OxdToast.waitForSuccess()`, called from `UserManagementPage.createUser()` at line 80, called from `usr.spec.ts:107` — the test's FIRST (legitimate, non-duplicate) user-creation call, using fresh `testData.unique('dup')` data
Attempts:        Full-suite run 2 of 3: failed attempt 1 (41.0s), passed attempt 2 (35.2s, automatic retry). Isolated reproduction immediately after: 3/3 clean, single-worker, `--retries=0`, `--trace=on` (21.7s, 21.3s, 23.4s) — no flake in isolation
Hypothesis:      Not state pollution (fresh unique data every run, first non-duplicate call, `testData.track()` cleanup runs after the test not before); not a locator defect (the same `.oxd-toast-content--success` locator that failed here is the one already exercised cleanly by every other Save flow across the whole suite, including 2/3 official full-suite runs and 3/3 isolated reruns of this exact test). The run in which this failed was independently and broadly slower across entirely unrelated screens (e.g. `TC_ADM_QUA_001` 35.2s vs. 11.6s/13.1s in the clean runs; `TC_ADM_CFG_001` 18.4s vs. 6.6s/6.0s), pointing to a real, transient shared-demo slowdown during that run's specific time window, not a defect isolated to this test or component
Root cause:      ENV_INSTABILITY — evidence: (1) the failure disappeared completely across 3/3 clean isolated reruns under normal conditions immediately afterward, ruling out a deterministic script defect; (2) the failing run showed a uniform ~2–3x slowdown across unrelated screens and unrelated component code (BRD/CFG/JOB/QUA, not just USR), which a single test's own defect cannot explain; (3) the specific failure is a generic 15s wait-timeout on a Save action already proven reliable everywhere else in the project — consistent with CLAUDE.md §5.3's own documented reality of rate limiting/slowness under load on this shared public demo
Fix layer:       none — per `heal.md`'s ENV_INSTABILITY branch, no code change is prescribed
Change:          No code change. Workers were already at the project minimum (1, per this Step 2/3 run's own configuration) so "reduce workers" does not apply further. Recorded here as an accepted environmental risk, not quarantined via `test.skip`/`test.fixme` — the test is not defective, and Playwright's own `retries: 1` config already absorbs exactly this class of transient failure without masking it (the run still correctly reported it as `flaky`, not silently `ok`)
Verification:    3/3 consecutive clean isolated reruns (21.7s / 21.3s / 23.4s) stand in for the "3 consecutive green" requirement, since no code changed to verify — this is the reproduction step itself doubling as the verification that the test's own logic is sound. Official Step 2 runs 1 and 3 (both 47/47, no retries) independently confirm the test passes reliably under normal load
Prevention rule: A single `flaky`-flagged test in an official multi-run pass, on a suite-wide-slow run, with clean isolated reproduction and no locator/state signature, is diagnosed as ENV_INSTABILITY and recorded, not chased with a code change that would only mask the real cause

---

## Summary by root-cause class

| Class | Count | Entries |
|---|---|---|
| TIMING | 8 | HEAL-001, 006, 010, 012, 013, 014, 015, 019 |
| LOCATOR_DRIFT | 10 | HEAL-002, 003, 004, 005, 007, 008, 009, 017, 018, 021 |
| TEST_LOGIC | 3 | HEAL-011, 016, 020 |
| ENV_INSTABILITY | 1 | HEAL-022 |
| STATE_POLLUTION | 0 | — |
| PRODUCT_BUG | 0 (by design — see below) | — |

**Why PRODUCT_BUG is 0, not missing:** this suite carries two live, deterministic
product defects — **BUG-001** (deleting an in-use Nationality silently orphans
the owning employee's field, `TC_ADM_NAT_010`) and **BUG-002** (uploading an
unsupported file type on Corporate Branding shows no error message at all,
`TC_ADM_BRD_001`). Neither went through the heal cycle, because neither was ever
"broken then fixed" — both were asserted directly against their actual, confirmed
behavior from the moment each test was written, per CLAUDE.md §6.4's rule that a
deterministically-reproducible defect a test can positively confirm is asserted
directly, not `test.fixme()`'d. `test.fixme()` is reserved for a case that cannot
complete a run at all, which neither of these is. **Zero `test.fixme()` calls
exist anywhere in this suite.**

## Quarantined tests

**None.** `TC_ADM_USR_002` (HEAL-022) was evaluated for quarantine and explicitly
NOT quarantined: it reproduces cleanly under normal load (3/3 isolated, 2/3 of the
official full-suite runs), workers are already at the project minimum, and the
failure signature matches this shared demo's own documented instability
(CLAUDE.md §5.3), not a defect in the test.

## Residual risk

- **Shared-demo instability (HEAL-022's class) is not eliminated by any fix and
  cannot be** — CLAUDE.md §5.3 documents this as an accepted characteristic of
  testing against a live, shared, public demo with real concurrent users. A future
  run may show another isolated, environment-driven flake on a different test;
  Playwright's `retries: 1` is the accepted mitigation, not a code fix.
- **Environment drift can silently invalidate a previously-confirmed selector**
  (HEAL-021's exact failure mode) — this was caught once during `/code-review` by
  chance of timing, not by any automated drift-detection this project has. A
  similar new widget added to the Dashboard (or any other shared chrome) in the
  future could reintroduce the same class of ambiguity elsewhere, undetected
  until it manifests as a live failure or another manual review catches it.
- **BUG-001 and BUG-002 remain live, unfixed product defects** (this project
  tests, it does not patch OrangeHRM itself) — if a future OrangeHRM demo update
  silently fixes either behavior, the corresponding test (`TC_ADM_NAT_010`,
  `TC_ADM_BRD_001`) will start failing by design, since it currently asserts the
  buggy behavior as correct. That failure, if it ever occurs, should be
  triaged as a product-behavior change requiring a test update, not treated as a
  new regression to heal.
