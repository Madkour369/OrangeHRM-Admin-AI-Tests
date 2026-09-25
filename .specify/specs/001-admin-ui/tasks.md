# Tasks — Feature 001: Admin Module

Milestone breakdown per **CLAUDE.md §3 (Non-Negotiable Pipeline Order)** and **§6 (Artifact
Contracts)**. This file supersedes the earlier 4-milestone / root-layout version of itself —
see reconciliation note at the bottom.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `(M#)` owning milestone.

**Gate rule (CLAUDE.md §3):** milestone *N+1* may not begin until milestone *N*'s artifact
exists on disk, is non-empty, and passes the Definition of Done below. Skipping a gate
requires an explicit `GATE-OVERRIDE` recorded at the top of the produced artifact.

---

## M1 — PRD — `[x]` COMPLETE

**Deliverable:** `deliverables/01-prd/prd.md`

**Definition of Done (CLAUDE.md §6, M1):**
- [x] Vision, scope, personas
- [x] In/out of scope, with API testing explicitly out of scope
- [x] Module inventory for all 12 UI modules
- [x] Admin deep-dive: Epics → User Stories → Gherkin acceptance criteria
- [x] NFRs, assumptions, risks
- [x] Traceability seed ids

**Gate G1 (M1 → M2):** `prd.md` exists, non-empty, DoD met. ✅ **VERIFIED — M1 complete.**

---

## M2 — Exploration — `[x]` COMPLETE, pending sign-off

**Deliverable:** `deliverables/02-exploration/exploration.md` (+ `evidence/*.png`)

**Definition of Done (CLAUDE.md §6, M2):**
- [x] Per sub-module: navigation path, UI inventory, observed behaviour
- [x] Findings table (`FIND-###` usability/UX)
- [x] Bug table (`BUG-###` functional)
- [x] Locator risk register (element → chosen locator → stability rating → fallback)
- [x] Flakiness log
- [x] Screenshots captured to `deliverables/02-exploration/evidence/`
- [x] No automation code written during this milestone (manual-first rule)
- [x] 7 requirement corrections back-propagated into `prd.md` and `spec.md`

**Gate G2 (M2 → M3):** `exploration.md` exists, non-empty, DoD met, AND zero automation
(`*.spec.ts`) was produced as part of this milestone's work, AND explicit user sign-off is
recorded. **Status: DoD met on disk; awaiting explicit user sign-off before G2 opens.**

> Note: `deliverables/02-exploration/test-design.md` is **not** an M2 deliverable. The test
> design catalogue is M3's `deliverables/03-test-design/test_design.csv` (see below). Any
> earlier reference to a `test-design.md` path is superseded.

---

## M3 — Test Design — `[ ]` NOT STARTED

**Deliverable:** `deliverables/03-test-design/test_design.csv`

**Exact header (CLAUDE.md §6, order fixed):**
```
TC_ID,Epic_ID,Story_ID,Module,Sub_Module,Title,Preconditions,Test_Steps,Test_Data,Expected_Result,Type,Priority,valid in scope,scope_reason,needs automation,automation_reason,Automation_ID,Linked_Bug
```

**Definition of Done:**
- [ ] Every `Story_ID` in `spec.md` appears at least once, with positive, negative, and
      boundary cases
- [ ] `valid in scope` (`Yes`/`No`) populated for every row
- [ ] `needs automation` (`Yes`/`No`) populated for every row
- [ ] Every `No` in either scope column has a non-empty reason cell
      (`scope_reason` / `automation_reason`)
- [ ] Cases blocked by a recorded `BUG-###` are marked `valid in scope = No` with the bug id
      named in `scope_reason`
- [ ] Multi-line steps use `\n` inside a quoted cell; file is UTF-8, RFC-4180 quoted,
      comma-safe

**Gate G3 (M3 → M4):** `test_design.csv` exists, non-empty, header matches exactly, DoD met.

---

## M4 — Execution & Reporting — `[ ]` NOT STARTED

**Deliverable:** `deliverables/04-execution/agent_execution_report.html`
(+ `deliverables/04-execution/evidence/*`)

**Definition of Done (CLAUDE.md §6, M4):**
- [ ] Single self-contained HTML file — inline CSS/JS, no CDN
- [ ] Run metadata section
- [ ] Executive summary with pass/fail/blocked donut chart
- [ ] Results table, filterable by status/priority/sub-module
- [ ] Bug report cards: id, title, severity, priority, steps, expected, actual, evidence,
      status
- [ ] Traceability matrix: Story → TC → Result
- [ ] Flakiness/observation appendix
- [ ] Only `valid in scope = Yes` cases from the M3 CSV are executed here
- [ ] Manual execution (manual-first rule) — no `*.spec.ts` written during this milestone
- [ ] Every bug card backed by an evidence screenshot on disk

**Gate G4 (M4 → M5):** `agent_execution_report.html` exists, non-empty, DoD met, all bug
cards have evidence.

---

## M5 — Automation — `[ ]` NOT STARTED

**Deliverables:**
- Playwright POM suite: `src/pages/`, `src/components/`, `src/fixtures/`, `src/utils/`,
  `src/data/`, `tests/admin/*.spec.ts` (CLAUDE.md §4 repository contract)
- `deliverables/05-automation/healing_process.md`

**Definition of Done (CLAUDE.md §6, M5):**
- [ ] Every `needs automation = Yes` case from the M3 CSV is implemented
- [ ] Page objects contain no assertions
- [ ] `src/base`, `src/components`, `src/fixtures`, `src/utils` contain nothing
      Admin-specific (module-agnostic rule, CLAUDE.md §4)
- [ ] Locator strategy follows CLAUDE.md §5.1 priority order; no forbidden patterns
      (positional XPath, index-based `nth()` on business data, etc.)
- [ ] `healing_process.md` has one entry per failure with all required columns: ID,
      Timestamp, Test, Symptom, Raw error, Hypothesis, Diagnosis (root cause class), Fix
      applied, Verification (N consecutive green), Prevention rule added
- [ ] No healing entry resolves a failure with only a hard wait (`waitForTimeout`) —
      escalate to an element-state wait
- [ ] Every automated test traces to exactly one `TC_ID` from the M3 CSV
- [ ] `test.fixme()` + linked `BUG-###` used wherever a case would otherwise encode buggy
      behaviour as correct (CLAUDE.md §5.4)

**Gate G5 (release):** full suite green for N consecutive runs (per healing doc
verification column); `/code-review` run clean.

---

## Reconciliation note (2026-09-23)

This file previously described a **4-milestone** pipeline (PRD → Exploration & Test
Design → Automation → Execution & Reporting) with test code and utilities at the repo
root (`pages/`, `tests/`, `utils/`). That structure belonged to the stock SpecKit
scaffolding this repo was generated from and conflicts with `CLAUDE.md`'s 5-milestone,
`src/`-layout pipeline, which governs this workspace and under which M1 and M2 were
actually produced. Per explicit ruling, `CLAUDE.md` wins; this file has been rewritten to
match it. `prd.md`, `spec.md`, and `exploration.md` are unaffected and remain correct as
written. Disposition of the pre-existing root-level `pages/`, `tests/`, `utils/` files is
tracked separately and has not yet been decided — see reconciliation report.
