# Implementation Plan — Feature 001: Admin Module

Governs how `spec.md` becomes running Playwright code, under Constitution v1.1 and
CLAUDE.md (the authoritative pipeline document since the Gate G2 reconciliation,
2026-09-23 — see `.specify/memory/constitution.md`'s v1.1 changelog entry).

> **Reconciliation note (2026-09-24):** this file was the one artifact left un-updated
> at G2 — it still described the pre-reconciliation 4-milestone model and root-level
> `pages/`/`tests/`/`utils/` layout after `tasks.md` and the constitution had already
> moved to CLAUDE.md's 5-milestone, `src/`-layout model. Rewritten below to match what
> was actually built in M5 Phase 1. No standard is weakened by this rewrite — the
> scope, traceability, progressive-specification, and shared-demo-safety rules are
> unchanged; only the stale structural description is corrected.

## 1. Milestones

| Milestone | Deliverable | Gate |
|---|---|---|
| **M1 — PRD** | `deliverables/01-prd/prd.md` | G1 |
| **M2 — Exploration** | `deliverables/02-exploration/exploration.md` | G2 |
| **M3 — Test Design** | `deliverables/03-test-design/test_design.csv` | G3 |
| **M4 — Execution & Reporting** | `deliverables/04-execution/agent_execution_report.html` | G4 |
| **M5 — Automation** | `src/` Playwright suite + `deliverables/05-automation/healing_process.md` | G5 |

Full milestone content and Definition-of-Done checklists live in
`.specify/specs/001-admin-ui/tasks.md`, the actual source of truth for gate criteria —
this table exists here only so this plan's own structure section (§2) doesn't read in
isolation from the pipeline it implements.

**Status (2026-09-25): all five milestones complete, Gate G5 reached.** M1–M5 are done
(G1–G5 all signed off); M5's three build phases (foundation → page objects/tests →
`/code-review`/full-suite runs/`/heal`) all completed, CI is live and green on GitHub
Actions, and the project has been published. See §7 for what happened in each phase and
what came after G5.

## 2. Repository Conventions

Actual structure, as implemented (CLAUDE.md §4 — the framework/module-agnostic
layers on the left may never mention a module or screen name):

```
src/
  utils/
    scope.ts            isPage() type guard shared by every component
    fieldFactory.ts      field(), dropdown(), autocomplete(), checkbox(), waitForIdle(), uniqueValue()
  components/            The ONLY place raw oxd- selectors may appear, besides
                          fieldFactory.ts's one CLAUDE.md-mandated `.oxd-input-group` use:
    OxdDropdown.ts        .oxd-select-text / .oxd-select-dropdown
    OxdAutocomplete.ts    debounced remote-hint input, "No Records Found" empty state
    OxdToast.ts           .oxd-toast-content--success/--error/--info, pre-armed wait
    OxdTable.ts            record-count header, row/action-icon-by-class (never position), pagination
    OxdDialog.ts           .oxd-dialog-container confirm dialogs, verbatim text, outcome-not-text assertions
    OxdCheckbox.ts         .oxd-checkbox-wrapper trap; also exports OxdRadioGroup (same
                            wrapper-click trap, confirmed on radios too — added because
                            exploration.md §6/§8 generalised CLAUDE.md §5.2's checkbox-only
                            note after independently confirming it on this build's radios;
                            not in the original plan, added when the observation demanded it)
    OxdDatePicker.ts        yyyy-dd-mm format (confirmed, not ISO)
    OxdFileUpload.ts        real file-chooser flow, not a bare setInputFiles
  pages/
    base/
      BasePage.ts          shared nav/breadcrumb/idle-wait, zero screen mentions
      LoginPage.ts          does NOT extend BasePage (unauthenticated, no sidebar)
    admin/                 one page object per screen (13, built in Phase 2)
  fixtures/
    auth.fixture.ts         worker-scoped real UI login, storageState reuse, re-auth-on-expiry
    page.fixture.ts          module-agnostic authenticated page, lands on dashboard
    data.fixture.ts          TestDataRegistry — e2e_-prefixed data, LIFO teardown, best-effort on failure
    index.ts                 single import point for tests
  data/
    fixtures/                static binary upload fixtures (e2e_wrongtype.txt,
                              e2e_oversized.png) used by Corporate Branding's upload
                              tests — in active use, not reserved/unused
tests/
  admin/                   one test per W1 TC_ID (52: 47 built in Phase 2, 5 P0 cases promoted post-G5)
playwright.config.ts
.specify/
  memory/constitution.md
  specs/001-admin-ui/{spec.md, plan.md, tasks.md}
.claude/commands/          analyze.md, coverage.md, code-review.md, heal.md (CLAUDE.md's
                            original custom four), new-module.md (added post-G5, runs
                            this whole cycle for a new module) — plus the stock SpecKit
                            commands, untouched
.github/workflows/playwright.yml   CI, added post-G5 — see deliverables/00-summary/ci_cd.md
deliverables/
  00-summary/{implementation_summary.xlsx, solution_flow.html, prompts_used.{md,xlsx},
              ci_cd.md, final_review.md}   — added post-G5
  01-prd/prd.md
  02-exploration/{exploration.md, evidence/}
  03-test-design/{test_design.csv, test_design_coverage.md}
  04-execution/{agent_execution_report.html, evidence/, PROGRESS.md}
  05-automation/{healing_process.md, code_review.md, automation_execution_report.html,
                 PROGRESS.md}
```

The pre-existing root-level `pages/`, `tests/`, `utils/` scaffold referenced by this
plan's earlier revision was deleted at Gate G2 (confirmed clean, zero non-owned data
touched — see `deliverables/04-execution/PROGRESS.md`'s reconciliation entry). It is
gone, not "existing structure to preserve," and must not be recreated.

## 3. Test Data Strategy

- Unique identifiers come from `uniqueValue(domain)` in `src/utils/fieldFactory.ts`
  (`e2e_<domain>_<timestamp><random>`), per Constitution Article VI.1. The
  `TestDataRegistry` (`testData` fixture, `src/fixtures/data.fixture.ts`) wraps this
  with `.unique(domain)` and a `.track(label, cleanupFn)` registry.
- Cleanup: every test registers its own UI-driven teardown immediately after creating
  a record (not after the test "succeeds") — `testData.teardownAll()` runs registered
  cleanups in reverse (LIFO) order, best-effort, even after a mid-test failure. No
  global "wipe the demo" step; the demo is shared (Assumption A2, and directly
  confirmed repeatedly during M4 — concurrent third-party activity, including a
  second real user's session, was observed throughout).
- Configuration-mutating W1/W2 cases (Corporate Branding, Localization, Modules) wrap
  mutating assertions in a `try/finally`-equivalent (the registry's own teardown
  ordering) that restores prior state (Constitution VI.3). Modules' actual toggle
  mutation is out of scope entirely (`valid in scope = No` in the CSV) — only its
  read-only safety-rail state is asserted.

## 4. Execution Environment

- `playwright.config.ts`: `workers: 2` (Constitution VI.2 / Risk R2, unconditional —
  not CI-only), `retries: 1` locally / `2` in CI, `timeout: 90_000`, `expect.timeout:
  10_000`, `actionTimeout: 15_000`, `navigationTimeout: 30_000`, `trace:
  'on-first-retry'`, `video: 'retain-on-failure'`, `screenshot: 'only-on-failure'`,
  `baseURL: 'https://opensource-demo.orangehrmlive.com'`. `networkidle` is never used
  anywhere in config or code (CLAUDE.md §5.3 — this SPA's own polling/analytics make
  it unreliable); every wait is element-state based.
- **Chromium-only, deliberately.** The original stock config configured
  `chromium`/`firefox`/`webkit` projects. This plan drops firefox/webkit: every
  observation this project has ever made — the whole of M2's exploration and the
  whole of M4's manual execution, both extensive — was against Chromium via
  Playwright MCP. No cross-browser behaviour has ever actually been observed on this
  build, so configuring Firefox/WebKit projects would assert coverage this project
  has never earned. If a future cycle needs cross-browser evidence, that requires new
  M2-style exploration against those engines first, not just flipping a config flag.
- **`waitForIdle()`'s timeout, and why a longer wait was the correct fix.** Phase 1's
  own foundation smoke check hit a genuine live failure: `.oxd-loading-spinner`
  didn't reach count 0 within the global 10s `expect.timeout` on a fresh post-login
  Dashboard load. Diagnosed live, not guessed: the Dashboard renders several
  independent widgets, each with its own `.orangehrm-dashboard-widget-loader` >
  `.oxd-loading-spinner`, and on a cold session 1-2 can still be resolving past 10s
  (directly confirmed by re-checking a few seconds later: count reached 0, it wasn't
  stuck). This is a genuine timing characteristic of that specific multi-widget page,
  not a broken selector. **The fix was to widen `waitForIdle()`'s own timeout
  (default raised to 20,000ms, still overridable) on the exact same correct
  element-state assertion — not to add a `waitForTimeout`/sleep anywhere.** A fix
  that only adds a hard wait would have been rejected under this project's own
  healing discipline (CLAUDE.md §6); this instead escalates the timeout on an
  assertion that was already correctly conditioned on real page state, which the
  discipline explicitly treats as the acceptable escalation path. Re-verified after
  the fix: a fully fresh worker (no cached auth state), zero retries configured,
  passed cleanly in 19.6s.

## 5. Traceability Mechanics

- Every `test()` title is prefixed with its case id: `test('TC_ADM_USR_001 - add a
  valid ESS system user', ...)` (this project's real `TC_ADM_<SUB>_<nnn>` ids from
  `test_design.csv`, not the plan's earlier placeholder `TC_ADM_xx_nnn`/`TC_ADM_01_003`
  examples).
- `deliverables/03-test-design/test_design.csv`'s `Automation_ID` column already
  equals each `TC_ID` for every `needs automation = Yes` row and is the traceability
  key — no separate traceability-matrix file is generated for M5; the CSV plus each
  spec file's title prefix is the single source.
- IDs are never renumbered (Constitution III.2); a descoped case is marked
  `deprecated`, not removed.

## 6. Risk Handling in Automation

| Risk | Mitigation in code |
|---|---|
| R1 — product defects vs. flakiness | Cases carrying `Linked_Bug` assert the actual observed defect behaviour (BUG-001 through BUG-006) via an explicit known-defect assertion or `test.fixme()`, never the desired-but-absent behaviour; `retries: 1` absorbs transient flake only, and a test that only passes on retry is a `/heal` candidate, not a clean pass |
| R2 — rate limiting / shared demo | `workers: 2`; every test creates and tears down only its own `e2e_`-prefixed data; never asserts on a record it did not create, since real concurrent third-party activity on this account was directly observed throughout M4 |
| R3 — blast radius | Configuration > Modules' mutation, LDAP Configuration's Enable/Test/Save, and Corporate Branding's Publish/Reset are `valid in scope = No` in the CSV and are not automated at all, not merely tag-excluded |

## 7. Status — all phases complete

1. ~~M1–M4~~ — complete, all gates signed off.
2. ~~M5 Phase 1 (foundation)~~ — complete.
3. ~~M5 Phase 2~~ — complete. 13 page objects under `src/pages/admin/`, 47 tests under
   `tests/admin/`, one per W1 `TC_ID`. Built in order USR, JOB, QUA, NAT, ORG, BRD, CFG,
   NAV, running each screen's tests as it finished. A gap-accounting pass mid-Phase-2
   found 2 W1 cases missed by an incomplete initial query (Pay Grades, Work Shifts) and
   closed them, reaching the true 47/47. Post-G5, 5 P0 cases (`TC_ADM_NAV_003`/`004`,
   `TC_ADM_USR_005`/`006`/`007`) were promoted from W2 under the "every P0 case is Wave 1"
   rule (`test_design_coverage.md` §8.5), bringing W1 to 52/52.
4. ~~M5 Phase 3~~ — complete. `/code-review` (verdict: APPROVED, 1 Blocker + 8 Major
   fixed), three consecutive official full-suite runs (all green; one run's single
   flaky test diagnosed as `ENV_INSTABILITY` per `/heal` and recorded, not code-patched),
   `healing_process.md` written (22 entries covering the whole of M5's Phases 1–3).
   **Gate G5 reached.**
5. ~~Post-G5~~ — complete. CI added (`.github/workflows/playwright.yml`), published to
   GitHub, and a final outside-reviewer-style audit run
   (`deliverables/00-summary/final_review.md`) — that audit found a real CI-only
   flake (3 tests, all racing the same table-render timing gap under CI's specific
   network/CPU characteristics, never reproduced locally) and fixed it at the
   component layer (`OxdTable.waitForListRendered()`); see `HEAL-023`/`024`/`025`.

**Next actions for a future cycle**, not this one: build Wave 2's 84 scheduled cases
(mostly parameter variants against Wave 1's existing page objects, per
`test_design_coverage.md`'s reuse-ratio analysis), or run `/new-module` to start the same
cycle for a different OrangeHRM module.
