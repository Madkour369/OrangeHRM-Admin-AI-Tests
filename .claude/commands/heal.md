---
name: heal
description: Diagnose failing UI scripts, resolve selector/timing issues, log the experiment.
output: deliverables/05-automation/healing_process.md
---

# /heal — Diagnostic and Healing Cycle

**Principle:** diagnose before you touch. Proposal-only — no silent auto-fix.

## Procedure

### 1 Capture
Raw error text, failing selector/action, trace, screenshot, DOM snapshot of the target
container, console errors, attempt history.

### 2 Reproduce
Re-run the single test 3x with --trace on. Record the pass/fail pattern.
Deterministic failure and intermittent failure are different diseases.

### 3 Classify — exactly one root-cause class
| Class | Signature |
|---|---|
| LOCATOR_DRIFT | resolves to 0 or more than 1 node; strict-mode violation; DOM changed |
| TIMING | element exists later; spinner/overlay intercepts; toast already dismissed |
| STATE_POLLUTION | passes alone, fails in suite; leftover data; shared account state |
| ENV_INSTABILITY | 5xx, rate limit, demo reset, network; unrelated to the script |
| PRODUCT_BUG | the app genuinely misbehaves |
| TEST_LOGIC | wrong expectation, wrong data, wrong flow |

### 4 Diagnose and fix — by class
- LOCATOR_DRIFT -> run the /analyze candidate ladder against the live DOM; propose only a
  3/3 candidate; fix in the component wrapper if the pattern is generic, in the page object
  if screen-specific. Record old -> new with a confidence note.
- TIMING -> identify the true readiness signal (spinner count 0, row present, dialog
  detached, toast pre-armed) and wait on that. Adding waitForTimeout or widening a timeout
  without a named signal is rejected.
- STATE_POLLUTION -> fix the fixture/teardown or the uniqueness of the data suffix.
  Never weaken the assertion.
- ENV_INSTABILITY -> no code change. Quarantine with evidence, reduce workers, record it.
- PRODUCT_BUG -> file BUG-nnn, test.fixme() with the id, report as a product failure.
  Healing is forbidden here.
- TEST_LOGIC -> correct the test against the spec, not against observed behaviour.

### 5 Verify
Re-run the fixed test 3 consecutive times green, then the full suite once.
Record both results. Fewer than 3x green means the heal is not accepted.

### 6 Log — append to healing_process.md
```
### HEAL-nnn | <timestamp>
Test:            <Automation_ID / title>
Symptom:         <one line>
Raw error:       <verbatim>
Attempts:        <pass/fail pattern>
Hypothesis:      <what you suspected>
Root cause:      <CLASS> — <evidence that proves it>
Fix layer:       component | page | fixture | test | none
Change:          <old -> new, or "no code change">
Verification:    3/3 green (<run ids>), full suite <result>
Prevention rule: <rule added, or "n/a">
```

### 7 Escalate
If the same test heals twice for the same class, stop patching: raise a design defect and
fix the pattern framework-wide.

## Forbidden heals
waitForTimeout · timeout inflation without diagnosis · {force:true} to punch through an
overlay · .first() to dodge strict mode · in-test retry loops · deleting or weakening the
assertion · catching and ignoring the error.
