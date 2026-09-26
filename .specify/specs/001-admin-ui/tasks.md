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

## M2 — Exploration — `[x]` COMPLETE

**Deliverable:** `deliverables/02-exploration/exploration.md` (+ `evidence/*.png`)

**Definition of Done (CLAUDE.md §6, M2):**
- [x] Per sub-module: navigation path, UI inventory, observed behaviour
- [x] Findings table (`FIND-###` usability/UX) — 8 findings on file (FIND-001..008,
      FIND-008 added post-M4)
- [x] Bug table (`BUG-###` functional) — 6 bugs on file (BUG-001..006, BUG-003..006
      added post-M4)
- [x] Locator risk register (element → chosen locator → stability rating → fallback) —
      11 rows, plus an M5 corrections addendum
- [x] Flakiness log — 5 entries (FLAKE-001..005)
- [x] Screenshots captured to `deliverables/02-exploration/evidence/`
- [x] No automation code written during this milestone (manual-first rule)
- [x] 7 requirement corrections back-propagated into `prd.md` and `spec.md` (§13.1)

**Gate G2 (M2 → M3):** `exploration.md` exists, non-empty, DoD met, zero automation
(`*.spec.ts`) was produced as part of this milestone's work. ✅ **VERIFIED — signed off
2026-09-23, M3 begun immediately after.**

> Note: `deliverables/02-exploration/test-design.md` is **not** an M2 deliverable. The test
> design catalogue is M3's `deliverables/03-test-design/test_design.csv` (see below). Any
> earlier reference to a `test-design.md` path is superseded.

---

## M3 — Test Design — `[x]` COMPLETE

**Deliverable:** `deliverables/03-test-design/test_design.csv` (+
`test_design_coverage.md`, the `/coverage` audit)

**Exact header (CLAUDE.md §6, order fixed, plus the approved `automation_wave` column —
see the Wave 1/Wave 2 note below):**
```
TC_ID,Epic_ID,Story_ID,Module,Sub_Module,Title,Preconditions,Test_Steps,Test_Data,Expected_Result,Type,Priority,valid in scope,scope_reason,needs automation,automation_reason,Automation_ID,Linked_Bug,automation_wave
```

**Definition of Done:**
- [x] Every `Story_ID` in `spec.md` appears at least once, with positive, negative, and
      boundary cases — 100% story coverage (33/33), 100% scenario coverage (168/168)
      after the `/coverage` audit closed 5 gaps
- [x] `valid in scope` (`Yes`/`No`) populated for every row — 203 rows, 186 Yes / 17 No
- [x] `needs automation` (`Yes`/`No`) populated for every row — 136 Yes / 67 No
- [x] Every `No` in either scope column has a non-empty reason cell
      (`scope_reason` / `automation_reason`) — 0 missing, confirmed by `/coverage`
- [x] Cases blocked by a recorded `BUG-###` are marked `valid in scope = No` with the bug id
      named in `scope_reason`
- [x] Multi-line steps use `\n` inside a quoted cell; file is UTF-8, RFC-4180 quoted,
      comma-safe

**Wave 1 / Wave 2 note:** the 136 `needs automation = Yes` cases were sequenced, not
descoped, into `automation_wave = W1` (52 cases, built in M5 — originally 47; 5 P0 cases promoted
post-G5 per `test_design_coverage.md` §8.5) and `W2` (84 cases,
**scheduled, not automated in this cycle** — every W2 row still carries `needs automation
= Yes` and an `Automation_ID`; `automation_wave` records only *when* it is built, never
*whether*). Rationale and the exact wave-selection rule are in
`test_design_coverage.md`'s "Execution sequencing" section.

**Gate G3 (M3 → M4):** `test_design.csv` exists, non-empty, header matches exactly, DoD
met. ✅ **VERIFIED — signed off 2026-09-23, M4 begun immediately after.**

---

## M4 — Execution & Reporting — `[x]` COMPLETE

**Deliverable:** `deliverables/04-execution/agent_execution_report.html`
(+ `deliverables/04-execution/evidence/*`, `deliverables/04-execution/PROGRESS.md`)

**Definition of Done (CLAUDE.md §6, M4):**
- [x] Single self-contained HTML file — inline CSS/JS, no CDN
- [x] Run metadata section
- [x] Executive summary with pass/fail/blocked donut chart
- [x] Results table, filterable by status/priority/sub-module
- [x] Bug report cards: id, title, severity, priority, steps, expected, actual, evidence,
      status — 6 cards (BUG-001..006)
- [x] Traceability matrix: Story → TC → Result
- [x] Flakiness/observation appendix
- [x] Only `valid in scope = Yes` cases from the M3 CSV are executed here — 186/186
      executed: 182 pass, 2 fail (`TC_ADM_NAV_004`, `TC_ADM_JOB_004`), 2 blocked
      (`TC_ADM_CFG_003`/`004`, ruled a permanent environment limitation, not a gap)
- [x] Manual execution (manual-first rule) — no `*.spec.ts` written during this milestone
- [x] Every bug card backed by an evidence screenshot on disk

**Gate G4 (M4 → M5):** `agent_execution_report.html` exists, non-empty, DoD met, all bug
cards have evidence. ✅ **VERIFIED — signed off 2026-09-24, M5 begun immediately after.**

---

## M5 — Automation — `[x]` COMPLETE (Wave 1, 52/136 needs-automation cases; Wave 2's 84
scheduled for a future cycle, not descoped — see the M3 note above)

**Deliverables:**
- Playwright POM suite: `src/pages/`, `src/components/`, `src/fixtures/`, `src/utils/`,
  `src/data/`, `tests/admin/*.spec.ts` (CLAUDE.md §4 repository contract) — 52 tests,
  52/52 green
- `deliverables/05-automation/healing_process.md` (27 entries, `HEAL-001..027`)
- `deliverables/05-automation/code_review.md` (`/code-review` verdict: APPROVED)
- `deliverables/05-automation/automation_execution_report.html` (self-contained,
  reuses the M4 report's template/CSS)

**Definition of Done (CLAUDE.md §6, M5):**
- [x] Every `needs automation = Yes` case from the M3 CSV **in Wave 1** is implemented
      (Wave 2's 84 cases are scheduled, per the M3 note above — the DoD's own wording
      governs the wave actually built this cycle)
- [x] Page objects contain no assertions
- [x] `src/base`, `src/components`, `src/fixtures`, `src/utils` contain nothing
      Admin-specific (module-agnostic rule, CLAUDE.md §4) — confirmed by grep, 0 hits
- [x] Locator strategy follows CLAUDE.md §5.1 priority order; no forbidden patterns
      (positional XPath, index-based `nth()` on business data, etc.) — confirmed by
      `/code-review`
- [x] `healing_process.md` has one entry per failure with all required columns: ID,
      Timestamp, Test, Symptom, Raw error, Hypothesis, Diagnosis (root cause class), Fix
      applied, Verification (N consecutive green), Prevention rule added
- [x] No healing entry resolves a failure with only a hard wait (`waitForTimeout`) —
      escalate to an element-state wait
- [x] Every automated test traces to exactly one `TC_ID` from the M3 CSV — cross-checked,
      52/52 exact 1:1, 0 missing, 0 extra
- [x] `test.fixme()` + linked `BUG-###` used wherever a case would otherwise encode buggy
      behaviour as correct (CLAUDE.md §5.4) — in practice both `BUG-001`/`BUG-002` are
      deterministically reproducible and are asserted directly instead (the correct
      encoding per CLAUDE.md §6.4 for a defect a test CAN positively confirm); zero
      `test.fixme()` calls exist because no Wave-1 case needed that escape hatch

**Gate G5 (release):** full suite green for N consecutive runs (per healing doc
verification column); `/code-review` run clean. ✅ **VERIFIED — 3 consecutive official
local runs (8.4 min / 12.6 min-1 flaky-healed / 8.6 min), `/code-review` APPROVED, CI
green on GitHub Actions (2 runs; a 3-test CI-only flake diagnosed and fixed, see
`HEAL-023`/`024`/`025`).**

---

## Reconciliation note (2026-09-23)

This file previously described a **4-milestone** pipeline (PRD → Exploration & Test
Design → Automation → Execution & Reporting) with test code and utilities at the repo
root (`pages/`, `tests/`, `utils/`). That structure belonged to the stock SpecKit
scaffolding this repo was generated from and conflicts with `CLAUDE.md`'s 5-milestone,
`src/`-layout pipeline, which governs this workspace and under which M1 and M2 were
actually produced. Per explicit ruling, `CLAUDE.md` wins; this file has been rewritten to
match it. `prd.md`, `spec.md`, and `exploration.md` are unaffected and remain correct as
written. **Resolved 2026-09-23:** the pre-existing root-level `pages/`, `tests/`,
`utils/` scaffold (and its `.spec.ts` files) was deleted as the final G2 step, after
recording its file paths and line counts and confirming it touched no non-owned data —
see `deliverables/04-execution/PROGRESS.md`'s reconciliation entry. It does not exist in
this repo and must not be recreated.

## Post-G5 (2026-09-25)

All five milestones and Gate G5 are complete (see each milestone's section above). Work
after G5, tracked here rather than as a new milestone since the constitution fixes the
pipeline at five:

- **CI:** `.github/workflows/playwright.yml` — manual (`workflow_dispatch`, primary),
  `push`/`pull_request` triggers; workers capped at 2 (Constitution VI.2); no cron
  (rationale: this suite runs against a shared public demo this project does not own).
  See `deliverables/00-summary/ci_cd.md`.
- **Publication:** pushed to `https://github.com/Madkour369/OrangeHRM-Admin-AI-Tests`
  (public). Two CI runs both green on `main`.
- **Final review:** `deliverables/00-summary/final_review.md` — an outside-reviewer-style
  audit of the whole project, run 2026-09-25, findings and fixes logged there.
- **Reusable-module command:** `.claude/commands/new-module.md` — runs this same
  five-milestone cycle for a new module, reusing everything module-agnostic unchanged.
