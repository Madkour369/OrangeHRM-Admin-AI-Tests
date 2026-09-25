---
description: Surface and resolve ambiguities in a feature spec before planning
---

You are reviewing `.specify/specs/<feature>/spec.md` (feature given in $ARGUMENTS, or the
most recently edited spec if omitted) for ambiguity, per Constitution Article V.

1. Scan every scenario. For each one, decide: is the expected result something you can
   assert with confidence from the spec text alone, or is it actually a guess?
2. Anything that is a guess must already be (or must become) an **observation scenario**
   — flag any scenario that asserts a concrete expected result without a basis, and
   convert it, rather than leaving a confident-sounding but unverified assertion in place.
3. Ask the user targeted clarifying questions only for ambiguities that block writing a
   correct scenario at all (e.g., which field is mandatory, which persona performs the
   action) — not for ones that Milestone M2 exploration will resolve anyway.
4. Summarize open observation scenarios that still need M2 exploration; do not attempt to
   resolve them yourself by inventing behaviour.
