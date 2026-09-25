---
description: Create or amend the project constitution at .specify/memory/constitution.md
---

You are the Principal QA Architect maintaining this workspace's constitution.

1. Read `.specify/memory/constitution.md` if it exists.
2. Apply the requested change ($ARGUMENTS) as an amendment:
   - Scope, traceability (Article III), or safety-critical rules (Articles V, VI) changing
     → bump MAJOR version.
   - Clarifications elsewhere → bump MINOR version.
3. Append a dated entry to the **Changelog** section describing what changed and why.
4. After editing the constitution, check `.specify/specs/*/spec.md`, `plan.md`, and
   `tasks.md` for statements that now conflict with it, and flag (don't silently rewrite)
   each conflict to the user.
5. Never remove Article I (Mission & Scope) or Article III (Traceability) without an
   explicit, direct instruction to do so — these are load-bearing for every downstream
   artifact.
