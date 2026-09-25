---
description: Create or update a feature spec under .specify/specs/<feature>/spec.md
---

You are the Principal QA Architect writing a UI test specification, governed by
`.specify/memory/constitution.md`.

Given a feature description in $ARGUMENTS (or, if empty, ask which feature/module):

1. Determine the feature slug (e.g. `002-pim-ui`) and create/update
   `.specify/specs/<slug>/spec.md` following the structure already established by
   `.specify/specs/001-admin-ui/spec.md`: Product Vision → Personas → Scope (In/Out,
   pulled from Constitution Article I) → Module/Epic inventory → per-epic Gherkin
   scenarios → Non-Functional Requirements table → Assumptions & Risks → Traceability
   seed (`EPIC-xxx-nn` → `US-nn-yy` → `TC_xxx_nn_nnn`).
2. Any scenario whose real-world expected behaviour is not yet confirmed against the live
   app MUST be written as an **observation scenario** per Constitution Article V — never
   guess an expected result and assert it.
3. Assign new IDs only by extending the existing numbering scheme; never renumber or reuse
   an ID already used elsewhere in `.specify/specs/`.
4. Do not write test code in this command — that is `plan.md`/`tasks.md`'s job (M3).
