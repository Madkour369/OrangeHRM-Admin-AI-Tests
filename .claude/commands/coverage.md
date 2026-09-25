---
name: coverage
description: Validate UI test-case coverage against the Admin module user stories.
output: deliverables/03-test-design/test_design_coverage.md
---

# /coverage — Requirement Coverage Audit

**Inputs:** deliverables/01-prd/prd.md and .specify/specs/001-admin-ui/spec.md
(authoritative ids), deliverables/03-test-design/test_design.csv, and at G5 the
implemented suite.

## Procedure
1. Parse all EPIC-ADM-* and US-* ids and every Gherkin scenario (expanding Scenario
   Outlines into one expected case per Examples row).
2. Parse the CSV; validate structure first:
   - header byte-exact, no duplicate TC_ID, RFC-4180 quoting valid
   - every `valid in scope = No` has a non-empty scope_reason
   - every `needs automation = No` has a non-empty automation_reason
   - every `needs automation = Yes` has an Automation_ID
3. Build the forward matrix Story -> TC_IDs and classify coverage:
   - Full — positive AND negative AND (boundary where the story implies limits)
   - Partial — some scenarios covered
   - None — no case
4. Build the reverse matrix TC_ID -> Story and flag orphans (cases with no story) —
   these are either scope creep or a missing requirement; say which.
5. Depth checks per CRUD screen: create, mandatory-empty, duplicate, boundary length,
   edit, delete-confirm, delete-cancel, search, empty-state, pagination, reset.
   Report any missing cell.
6. At G5 also verify Automation_ID -> an existing test title; report unimplemented and
   orphan tests.

## Output
- Coverage matrix table (Story | Scenarios | TC_IDs | Coverage | Gap)
- Gap list ranked by story priority, each with a concrete proposed TC_ID and title
- Structural-validation results
- Headline metrics: story coverage %, scenario coverage %, automation coverage %

## Rules
- Fail loudly. Do not round up. Partial is never reported as Full.
- Do not silently add cases; propose them and let M3 own the edit.
