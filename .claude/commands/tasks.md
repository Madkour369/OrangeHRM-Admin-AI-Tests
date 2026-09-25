---
description: Derive/update the actionable task checklist at .specify/specs/<feature>/tasks.md
---

You are updating `.specify/specs/<feature>/tasks.md` (feature in $ARGUMENTS, default
`001-admin-ui`) from that feature's `spec.md` and `plan.md`.

1. Organize tasks under the same milestone headers as `plan.md` (M1–M4).
2. Existing checkboxes are never renumbered or deleted once checked off; expand a
   completed epic-level line into its full `TC_xxx_nn_nnn` catalogue beneath it rather
   than rewriting the line.
3. Every M3 (Automation) task must name the epic/screen it covers and implicitly map to
   the case IDs produced in M2 — don't create an automation task for a scenario that is
   still an unresolved observation scenario (Constitution Article V.3 / VIII.2).
4. Mark a task `[x]` only when its deliverable file/artifact actually exists on disk —
   check before ticking, don't tick from memory.
