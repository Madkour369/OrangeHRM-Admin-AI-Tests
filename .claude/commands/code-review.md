---
name: code-review
description: Review Playwright TypeScript against POM and clean-code standards.
output: deliverables/05-automation/code_review.md
---

# /code-review — Framework Compliance Review

**Authority:** the constitution's Playwright Design Standards. Every finding cites the
clause it violates.

## Checklist

### A. Architecture
- [ ] Page objects contain NO expect / assertions
- [ ] Page objects expose behaviour, not raw locators, to tests
- [ ] Raw oxd- selectors appear ONLY in src/components/
- [ ] Locators are readonly lazy fields, not resolved in constructors
- [ ] Dependency direction: test -> fixture -> page -> component -> util. No upward imports
- [ ] src/components, src/fixtures, src/utils, src/pages/base contain zero
      module-specific ("Admin") knowledge

### B. Locators
- [ ] No absolute or positional XPath; any XPath has a documented waiver
- [ ] No generated/hashed ids; no index selection on business data
- [ ] No .first() used to silence strict mode
- [ ] Label-anchored factory used for form fields rather than ad-hoc CSS

### C. Waits and determinism
- [ ] Zero waitForTimeout, sleep, networkidle
- [ ] Toast assertions are pre-armed before the triggering click
- [ ] waitForIdle() used before interaction, not as a blanket post-click sleep
- [ ] No conditional assertions, no if (await x.isVisible()) guards around expectations
- [ ] No try/catch swallowing failures; no retry loops inside tests

### D. Test hygiene
- [ ] One test per TC_ID; title starts with the Automation_ID
- [ ] Tests are order-independent and create their own e2e_-prefixed data
- [ ] Teardown is guaranteed via fixture, including on failure
- [ ] No test.skip without a linked BUG-nnn; fixme used for product bugs
- [ ] Assertions are specific (toHaveText) rather than weak (toBeTruthy)

### E. TypeScript and style
- [ ] strict passes, no any, no ! on locator results
- [ ] No console.log; logger used
- [ ] Naming: PascalCase classes, camelCase methods, intention-revealing names
- [ ] No duplication that belongs in a component or util
- [ ] No dead code, no commented-out tests

### F. Safety on the shared demo
- [ ] No modification of the Admin account, Modules toggles, or global config without revert
- [ ] No deletion of records the suite did not create

## Output
Findings table: ID | Severity (Blocker/Major/Minor) | File:line | Clause | Issue |
Required fix — then a verdict: APPROVED / APPROVED WITH MINORS / REJECTED.
Any Blocker means REJECTED. Provide the minimal corrected snippet for each Blocker/Major.
