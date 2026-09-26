# OrangeHRM Admin — UI Test Automation

[![Playwright Tests](https://github.com/Madkour369/OrangeHRM-Admin-AI-Tests/actions/workflows/playwright.yml/badge.svg)](https://github.com/Madkour369/OrangeHRM-Admin-AI-Tests/actions/workflows/playwright.yml)

A gated, Spec-Driven Development QA pipeline for OrangeHRM's Admin module, built entirely
against the live public demo (`https://opensource-demo.orangehrmlive.com/`), UI only — zero
API testing, zero backend/database access. The pipeline runs five milestones (PRD →
Exploration → Test Design → Manual Execution → Automation), each gated (G1–G5) on the
previous milestone's Definition of Done, per `CLAUDE.md` (the standing system prompt for
this workspace) and `.specify/memory/constitution.md` (the governing rules).

The automation layer is Playwright + TypeScript, Page Object Model, with a strict
module-agnostic architecture: everything below `src/pages/<module>/` (fixtures,
components, utils, base pages) knows nothing about "Admin" specifically, so a future
module's cycle — run via `/new-module` — reuses it unchanged.

## Reusing this pipeline

- **Reusing on another system** → [`BOOTSTRAP.md`](BOOTSTRAP.md): one prompt that starts the
  whole five-milestone pipeline on any web system, given only a URL and a scope statement.
- **Reusing on another module** of OrangeHRM → [`/new-module`](.claude/commands/new-module.md):
  runs the same cycle for a new module, reusing everything below `src/pages/<module>/`.

## Deliverables

| # | Deliverable | Path |
|---|---|---|
| a | Implementation summary workbook | `deliverables/00-summary/implementation_summary.xlsx` |
| b | Solution flow diagram (HTML) | `deliverables/00-summary/solution_flow.html` |
| c | Product Requirements Document | `deliverables/01-prd/prd.md` |
| d | Exploration report + evidence | `deliverables/02-exploration/exploration.md` (+ `evidence/`) |
| e | Test design catalogue + coverage audit | `deliverables/03-test-design/test_design.csv` (+ `test_design_coverage.md`) |
| f | Manual execution report + evidence | `deliverables/04-execution/agent_execution_report.html` (+ `evidence/`) |
| g | Automation suite, execution report, healing log | `src/`, `tests/admin/*.spec.ts`, `deliverables/05-automation/automation_execution_report.html`, `deliverables/05-automation/healing_process.md` (+ `code_review.md`) |

Also in `deliverables/00-summary/`: `prompts_used.md` / `prompts_used.xlsx` (the full
chronological prompt archive that drove this project), `ci_cd.md` (this repo's GitHub
Actions workflow, explained), and `final_review.md` (an outside-reviewer-style audit of
the whole project, with every finding and fix).

**On scope:** `test_design.csv` designs 203 cases, 136 of which are `needs automation =
Yes`. **52 (Wave 1)** are built in `tests/admin/` this cycle — the other **84 (Wave 2)**
are deliberately **scheduled, not forgotten**: every Wave-2 row already carries
`needs automation = Yes` and an `Automation_ID`. Wave assignment is priority-driven, not
just capacity-driven: every `P0` case is Wave 1 by rule (`test_design_coverage.md` §8.5) —
5 cases were promoted from Wave 2 into Wave 1 and implemented when Priority itself was
tightened (§8.3), closing a gap where a confirmed defect (`BUG-003`) had no automated
regression guard. `test_design_coverage.md`'s "Execution sequencing" section explains the
original wave-split rationale and why most of Wave 2 is pure parameter variants against
Wave-1 page objects that already exist, not new code.

## Repository layout

```
.specify/                    # governing docs: constitution, spec, plan, tasks
.claude/commands/             # /analyze /coverage /code-review /heal /new-module
src/
  pages/base/                # BasePage, LoginPage — module-agnostic
  pages/admin/                # Admin page objects — module-specific
  components/                 # oxd primitives (Dropdown, Table, Toast, Dialog, …)
  fixtures/                   # auth / page / data fixtures
  utils/                      # fieldFactory, waits, data factory
tests/admin/*.spec.ts         # one test per Wave-1 TC_ID
.github/workflows/playwright.yml
```

## Running the suite locally

```bash
npm ci
npx playwright install --with-deps chromium

# Full Wave-1 suite (52 cases), matching how this project runs its own official checks:
npx playwright test tests/admin --workers=1

# A single screen, or a TC_ID substring:
npx playwright test tests/admin/usr.spec.ts
npx playwright test --grep TC_ADM_NAT

# View the last HTML report:
npm run report
```

Demo credentials default to `Admin`/`admin123` (the public demo's own account) via
`ORANGEHRM_USER`/`ORANGEHRM_PASSWORD`, with the fallback already set in
`playwright.config.ts` — no `.env` file or secrets setup is needed to run this locally.

Workers are capped at 2 everywhere in this project (Constitution Article VI.2) — the
shared public demo shows real rate limiting under heavier concurrency. See
`deliverables/00-summary/ci_cd.md` for the same rule as it applies in CI, and why there is
no scheduled/cron run.

## CI

See `deliverables/00-summary/ci_cd.md` for the full explanation of
`.github/workflows/playwright.yml`: what it does, how to trigger it manually from the
Actions tab, where to download the report artifact, and what would change to run this
against a private instance instead of the shared public demo.
