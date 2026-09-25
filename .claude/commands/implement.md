---
description: Execute the next unchecked milestone/task from tasks.md for a feature
---

Feature in $ARGUMENTS (default `001-admin-ui`). Read `.specify/memory/constitution.md`,
that feature's `spec.md`, `plan.md`, and `tasks.md`.

1. Find the earliest milestone (M1 → M4) with unchecked tasks; work within that milestone
   only — do not jump ahead to M3 automation while M2 exploration tasks are still open
   (Constitution Article VIII.2), and say so if asked to.
2. For an M1 (PRD) task: write the deliverable under `deliverables/01-prd/`.
3. For an M2 task: this requires actually exercising the live application (manual
   exploration) — if you cannot browse the live app in this session, produce the
   exploration checklist/questions instead of inventing findings, and say explicitly that
   the finding is unverified.
4. For an M3 task: write Playwright + TypeScript following the existing `pages/`/`tests/`
   conventions and Constitution Article IV; every new test must cite its `TC_xxx_nn_nnn`
   in the test title.
5. For an M4 task: wire CI / produce the traceability matrix or defect log from actual
   run output, not assumed results.
6. After finishing a task, tick it `[x]` in `tasks.md` and report what was produced.
