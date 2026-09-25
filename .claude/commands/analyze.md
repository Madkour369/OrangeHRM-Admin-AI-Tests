---
name: analyze
description: Scan OrangeHRM UI locators and flag unstable/dynamic selectors.
output: deliverables/02-exploration/locator_risk_register.md
---

# /analyze — Locator Stability Audit

**Input:** a screen name or URL path (defaults to every Admin sub-module), the live UI, and
any existing page objects.

## Procedure
1. Navigate to the target screen through the UI (authenticated, sidebar normalised).
2. Enumerate every interactive element: inputs, dropdowns, autocompletes, checkboxes,
   date fields, buttons, table rows/cells, pagination, dialogs, toasts, file inputs, tree nodes.
3. For each element, generate the candidate ladder in priority order:
   role+accessible name -> label-anchored .oxd-input-group factory -> data-test
   (where the app provides it) -> scoped stable text -> structural neighbour -> XPath (last).
4. Score each candidate 0-3:
   - Uniqueness — resolves to exactly 1 node (no strict-mode violation).
   - Semantic stability — depends on meaning, not on structure or generated ids.
   - Order independence — unaffected by row order, pagination, data volume, or
     sidebar collapse state.
5. Classify the element:
   - Stable — best candidate scores 3/3.
   - Fragile — 2/3; usable with a documented fallback.
   - Volatile — 1/3 or less; requires a component wrapper or a design workaround.
6. Flag automatically, with the reason:
   - positional or absolute XPath required
   - generated / hashed / numeric ids
   - text that also appears elsewhere on the page
   - .oxd-select-text mistaken for a native select
   - autocomplete inputs indistinguishable by placeholder
   - toast/spinner elements that are transient (must be pre-armed)
   - hidden inputs (checkbox, file) needing wrapper interaction
   - elements only present after lazy expansion (org tree)

## Output
Append/refresh a table:

| Element | Screen | Chosen locator | Candidate score | Stability | Failure mode | Mitigation / wrapper |

Plus a summary: counts per stability class, the top 5 highest-risk elements, and any
new component wrapper the audit proves is required.

## Rules
- Read-only. /analyze never edits source; it produces the register.
- Never propose a locator it has not resolved against the live DOM.
