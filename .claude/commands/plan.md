---
description: Turn a feature spec into an implementation plan under .specify/specs/<feature>/plan.md
---

You are the Principal QA Architect producing `.specify/specs/<feature>/plan.md`
(feature in $ARGUMENTS, default `001-admin-ui`), governed by
`.specify/memory/constitution.md` and consistent with that feature's `spec.md`.

Follow the structure of `.specify/specs/001-admin-ui/plan.md`:

1. **Milestones** table (M1 PRD → M2 Exploration & Test Design → M3 Automation →
   M4 Execution & Reporting) with gates — never let M3 start before M2's observation
   scenarios are resolved (Constitution Article VIII).
2. **Repository conventions** — reuse existing `pages/`, `tests/`, `utils/` layout; only
   add new subdirectories, don't restructure what already works.
3. **Test data strategy** — unique `e2e_`-prefixed data (Constitution VI.1), teardown
   scoped to what the test created, revert-on-mutate for shared config (Constitution VI.3).
4. **Execution environment** — base URL/credentials/viewport matrix (NFR-04), worker cap
   of 2 (Constitution VI.2), CI wiring.
5. **Traceability mechanics** — how `TC_xxx_nn_nnn` ids surface in test titles and in a
   traceability matrix deliverable.
6. **Risk handling** — map each spec Risk (Rn) to a concrete mitigation in the plan.

Do not generate the task checklist here — that belongs in `tasks.md` via `/tasks`.
