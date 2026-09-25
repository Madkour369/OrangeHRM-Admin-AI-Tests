---
name: new-module
description: Run the full SpecKit QA cycle for a new module, reusing everything built for Admin.
argument-hint: <MODULE_CODE> <Module Name>   e.g. PIM PIM  |  LEV Leave
---

# /new-module — Run the pipeline for $1 ($2)

## Reused unchanged — DO NOT rewrite any of these
- `.specify/memory/constitution.md` — same rules, same gates G1-G5
- `.specify/specs/001-admin-ui/plan.md` — same stack, layers, report schema
- `.claude/commands/analyze|coverage|code-review|heal` — module-agnostic already
- `src/components/`, `src/fixtures/`, `src/utils/`, `src/pages/base/` — the framework.
  Constitution III.10 forbids module-specific knowledge here. If $1 appears to need a
  change in these, that is a FRAMEWORK GAP: fix it generically so every module benefits,
  and record it. Never add a `$1`-specific branch to a shared file.
- `deliverables/04-execution/agent_execution_report.html` — template plus data object;
  only the data changes.

## Created new
- `.specify/specs/00N-$1-ui/spec.md` (N = next free number)
- `src/pages/$1/`
- `tests/$1/`
- deliverables suffixed for this module

## Procedure — same five gates, shortened by reuse

### M1 — Promote the PRD chapter
`deliverables/01-prd/prd.md` already specifies $2 at Tier 3. Do NOT write a new PRD.
Promote its chapter to Tier 1 in place: full field inventory tables, module business rules
referencing existing BR-nn ids, stories `US-$1-nn-yy` with inline Tier 1 Gherkin (happy
path, mandatory-empty, duplicate, boundary, invalid format, cancel, delete-confirm,
delete-cancel, empty search, pagination, plus every workflow state transition). Change its
QA cycle marker to ACTIVE CYCLE. Update the Appendix A traceability matrix. Preserve every
existing id. Mirror new ids into the new spec.md. TO CONFIRM markers for anything
unverified. **Gate G1.**

### M2 — Exploration
Read `deliverables/02-exploration/exploration.md` FIRST: its locator risk register already
records how oxd components behave on this build, including the M5 corrections. Confirm
they hold on $2's screens and record only deltas plus whatever is new. Answer every new
TO CONFIRM. Zero automation code.
Output: `exploration-$1.md` + `evidence-$1/` **Gate G2.**

### M3 — Test design
Same CSV header, byte-exact, including `valid in scope`, `needs automation` and
`automation_wave`. TC ids `TC_$1_<sub>_nnn`. Every No carries a reason. Run /coverage.
Output: `test_design-$1.csv` **Gate G3.**

### M4 — Manual execution + HTML report
Execute only `valid in scope = Yes`. Reuse the report template unchanged — only the
injected data object changes.
Output: `agent_execution_report-$1.html` **Gate G4.**

### M5 — Automation
Write ONLY `src/pages/$1/` and `tests/$1/`. Everything below `src/pages/` exists — import
it. Before writing a page object, check whether an existing component wrapper covers the
control; build a new wrapper only for a genuinely new oxd primitive, and build it
generically. Run /code-review, then /heal on every failure. 3 consecutive green runs.
Output: the suite + `healing_process-$1.md` **Gate G5.**

## Reuse report — produce this at the end
| Asset | Reused as-is | Extended | Newly created |
State lines written new versus reused, and name any framework gap found. If more than a
handful of lines had to change below `src/pages/`, the architecture has leaked — say so
explicitly rather than quietly patching it.

## Rules
Announce each gate, verify its DoD, stop for sign-off. UI only. Strictly sequential, one
browser. Shared-demo safety: e2e_ prefix, self-cleanup, never touch records you did not
create.
