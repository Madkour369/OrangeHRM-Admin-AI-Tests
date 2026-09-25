# OrangeHRM QA Automation — Project Constitution

**Version:** 1.1
**Ratified:** 2026-09-20
**Amended:** 2026-09-23
**Applies to:** All specs, plans, tasks, and test code produced under this workspace.

This constitution is the highest-authority document in the workspace. Every `spec.md`,
`plan.md`, `tasks.md`, and generated test file must be consistent with it. Where a
downstream artifact conflicts with this document, this document wins and the artifact
must be corrected.

---

## Article I — Mission & Scope

1.1. The mission of this workspace is to produce a deterministic, maintainable, UI-level
     Playwright + TypeScript test suite for OrangeHRM
     (`https://opensource-demo.orangehrmlive.com/`), beginning with the Admin module.

1.2. **In scope:** anything reachable and operable through the rendered web interface —
     navigation, forms, validation, search/filter, pagination, tables, modals, toasts,
     session behaviour, responsive layout, and keyboard/accessibility basics.

1.3. **Out of scope, permanently:** REST/API testing, backend or database verification,
     performance/load testing, security penetration testing, email delivery verification,
     native mobile apps, and third-party identity-provider integration beyond UI form
     behaviour. A task that requires stepping outside the rendered browser DOM is out of
     scope by definition, regardless of how convenient it would be.

1.4. Scope changes (adding a module, lifting an out-of-scope item) require an explicit
     amendment to this constitution and a version bump, not a silent addition to a spec.

## Article II — Roles

2.1. **Principal QA Architect** (the assistant, in this role) owns the SpecKit workspace:
     constitution, specs, plans, tasks, and traceability integrity.

2.2. Four personas govern acceptance-criteria framing: System Administrator (primary),
     ESS User, Hiring/HR Manager, QA Engineer. Every user story must be written from one
     of these personas' point of view.

## Article III — Traceability (binding)

3.1. All work is traced through a fixed hierarchy:
     `EPIC-xxx-nn` → `US-nn-yy` → `TC_xxx_nn_nnn` → `Automation_ID` → `BUG-nnn`.

3.2. IDs assigned in a `spec.md` are **authoritative** and must be reused verbatim in
     `plan.md`, `tasks.md`, test file names, and Playwright `test.describe`/`test` titles.
     IDs are never renumbered once a spec is committed; a removed case is marked
     `deprecated`, not deleted and reused.

3.3. Every automated test must be traceable back to exactly one `TC_xxx_nn_nnn`. A test
     with no traceable case ID is not permitted to merge.

## Article IV — Tooling & Architecture

4.1. The suite is built on Playwright + TypeScript, Page Object Model, under the layout
     fixed by `CLAUDE.md` §4:

     ```
     src/pages/          # Page Objects — no assertions inside
     src/components/      # oxd primitives: Dropdown, Autocomplete, Toast, Table, Dialog, DatePicker
     src/fixtures/         # auth fixture, page fixture, data fixture
     src/utils/            # locator factory, wait helpers, data factory, logger
     src/data/             # test data builders (no hardcoded IDs)
     tests/admin/*.spec.ts
     ```

     New screens get new page objects under `src/pages/admin/`; existing page objects are
     extended, not duplicated. **Module-agnostic rule:** nothing in `src/base`,
     `src/components`, `src/fixtures`, or `src/utils` may mention "Admin" — swapping the
     module under test must require only a new `spec.md` + new `src/pages/<module>/` +
     new `tests/<module>/`.

4.2. Test data helpers live in `src/utils/` (data factory) and `src/data/` (test data
     builders). All dynamic values (usernames, unit names, record names) are generated
     through these modules, not inlined as ad-hoc strings in test files.

4.3. CI executes via `.github/workflows/playwright.yml`. Any new npm script or config
     change that affects CI must keep that workflow green.

4.4. The repository previously carried a root-level `pages/`, `tests/`, `utils/` tree from
     initial stock scaffolding. That tree does not satisfy 4.1 and its disposition
     (fold into `src/`, or retire) is resolved before or during M5, not silently.

## Article V — Progressive Specification (Observation Before Assertion)

5.1. Where the live application's actual behaviour is unknown or ambiguous at spec-writing
     time (e.g., overnight work-shift handling, nationality-deletion-while-in-use), the
     scenario is written as an **observation scenario**: it describes the action and
     states that the outcome will be recorded rather than asserted.

5.2. Observation scenarios are only convertible into asserting Playwright tests **after**
     manual exploration against the live demo, during Milestone M2. Exploration findings
     are recorded in an `exploration.md` file alongside the spec they resolve.

5.3. It is a constitution violation to hard-code an assumed expected result into an
     automated test for a scenario that has not been exploration-verified. When in doubt,
     the test must be marked `needs exploration` rather than guessed.

## Article VI — Test Data & Environment Hygiene

6.1. **Self-contained data.** No test may depend on pre-existing or shared demo records
     (Assumption A1). Every test creates the records it needs, prefixed `e2e_` plus a
     unique run-scoped suffix, and that prefix is what bulk-cleanup routines key on.

6.2. **Independence & parallel safety.** Tests must be independent and idempotent. Given
     the shared, concurrently-mutated nature of the public demo (Assumption A2) and
     observed rate limiting (Risk R2), Playwright workers are capped at **2** unless a
     future amendment raises the cap after evidence of stability.

6.3. **Revert-on-mutate.** Any test that changes global or shared configuration —
     Corporate Branding, colour theme, Localization, Modules enablement — must revert its
     own change by the end of the test, regardless of pass/fail outcome (use
     `test.afterEach`/`finally` semantics). Screens with high blast radius on the shared
     public demo (notably Configuration → Modules) default to **observe-only**; they are
     documented and exercised manually, not automated, unless explicitly re-scoped.

6.4. Destructive actions taken by a test (delete, bulk delete) must only ever target
     records the test itself created under the `e2e_` prefix. Deleting unprefixed or
     pre-existing records is prohibited.

## Article VII — Non-Functional Baseline

Every screen under test, unless explicitly waived in its spec, is held to:

- **NFR-01** Destructive actions are confirmed by a modal; cancel is non-destructive.
- **NFR-02** Every save produces an explicit success or error toast.
- **NFR-03** Validation errors are field-adjacent, human-readable, and free of raw codes.
- **NFR-04** Layout is usable at 1920×1080, 1366×768, and 768×1024.
- **NFR-05** No client-side console errors during happy-path navigation.
- **NFR-06** Primary flows are keyboard-reachable via `getByRole`, with sane tab order.
- **NFR-07** Session expiry returns the user to login without a broken screen.
- **NFR-08** Spinners/loading states clear within a 10s perceived-time budget.

## Article VIII — Milestone Discipline

8.1. Work proceeds in the **five milestones fixed by `CLAUDE.md` §3 and §6**, each
     producing a required deliverable under `deliverables/`, gated `G1`–`G5` per
     `.specify/specs/001-admin-ui/tasks.md`:

     - **M1 — PRD** (`deliverables/01-prd/prd.md`): business-facing product requirements,
       derived from and consistent with `spec.md`.
     - **M2 — Exploration** (`deliverables/02-exploration/exploration.md`): manual UI
       exploration of ambiguous behaviour (Article V), findings/bug tables, locator risk
       register. No automation code (manual-first rule).
     - **M3 — Test Design** (`deliverables/03-test-design/test_design.csv`): the
       finalized `TC_xxx_nn_nnn` catalogue, with `valid in scope` and `needs automation`
       columns per case.
     - **M4 — Execution & Reporting** (`deliverables/04-execution/agent_execution_report.html`):
       manual execution of every `valid in scope = Yes` case (manual-first rule), bug
       report cards, traceability matrix. No automation code.
     - **M5 — Automation** (`src/` Playwright POM suite +
       `deliverables/05-automation/healing_process.md`): implementation of every
       `needs automation = Yes` case, following Articles III and IV, with an experiment
       log entry per healing cycle.

8.2. A milestone may not be skipped. Automation (M5) of a scenario that has not passed
     through M2 exploration and M3 test design is a constitution violation per Article
     V.3. No `*.spec.ts` may be written before M4 is signed off (manual-first rule,
     `CLAUDE.md` §3).

## Article IX — Amendment Procedure

9.1. This constitution is versioned (semver-ish: MAJOR.MINOR). Any change to Articles
     I, III, V, or VI (scope, traceability, or safety-critical rules) is a MAJOR bump;
     clarifications elsewhere are MINOR.

9.2. Every amendment is dated and appended to a **Changelog** section below; the rest of
     the document always reflects current, not historical, rules.

---

## Changelog

- **v1.1 (2026-09-23):** Reconciled with `CLAUDE.md` at Gate G2. `CLAUDE.md` ruled
  authoritative over the stock SpecKit scaffolding this workspace was generated from.
  Changed: Article IV (tooling/architecture) now specifies the `src/pages/`,
  `src/components/`, `src/fixtures/`, `src/utils/`, `src/data/` layout and the
  module-agnostic rule, replacing the root-level `pages/`/`utils/` references; Article
  VIII (milestone discipline) now describes five milestones (PRD → Exploration → Test
  Design → Execution & Reporting → Automation) with gates G1–G5, replacing the prior
  four-milestone model. No change to Articles I, III, V, VI, or VII — scope, traceability,
  progressive-specification, data/environment hygiene, and the NFR baseline are
  unaffected and unweakened. MINOR bump per Article IX.1 (no change to a MAJOR-bump
  article).
- **v1.0 (2026-09-20):** Initial ratification, covering Admin module (Feature 001).
